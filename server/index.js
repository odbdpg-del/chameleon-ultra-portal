import express from "express";
import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const bridgePath = path.join(rootDir, "bridge", "chameleon_bridge.py");
const clientPython = path.join(
  rootDir,
  "..",
  "ChameleonUltra",
  "software",
  ".venv",
  "Scripts",
  "python.exe",
);

const app = express();
app.use(express.json());

const RELEASES_URL = "https://api.github.com/repos/RfidResearchGroup/ChameleonUltra/releases?per_page=12";
let releaseCache = { expiresAt: 0, payload: null };
const downloadsDir = path.join(rootDir, "downloads");
const slotMetadataPath = path.join(rootDir, "server", "slot-metadata.json");
const bundledNrfutilPath = path.join(
  process.env.LOCALAPPDATA || "",
  "Microsoft",
  "WinGet",
  "Packages",
  "NordicSemiconductor.nrfutil_Microsoft.Winget.Source_8wekyb3d8bbwe",
  "nrfutil.exe",
);
fs.mkdirSync(downloadsDir, { recursive: true });

function resolveNrfutil() {
  if (bundledNrfutilPath && fs.existsSync(bundledNrfutilPath)) {
    return bundledNrfutilPath;
  }
  return "nrfutil";
}

const defaultColors = [
  "amber",
  "blue",
  "mint",
  "rose",
  "violet",
  "cyan",
  "gold",
  "slate",
];

function readSlotMetadata() {
  if (!fs.existsSync(slotMetadataPath)) {
    const seed = Object.fromEntries(
      Array.from({ length: 8 }, (_, index) => [
        String(index + 1),
        {
          displayName: "",
          category: "",
          tags: [],
          archived: false,
          color: defaultColors[index % defaultColors.length],
        },
      ]),
    );
    fs.writeFileSync(slotMetadataPath, JSON.stringify(seed, null, 2));
    return seed;
  }

  return JSON.parse(fs.readFileSync(slotMetadataPath, "utf8"));
}

function writeSlotMetadata(metadata) {
  fs.writeFileSync(slotMetadataPath, JSON.stringify(metadata, null, 2));
}

function slotExportPayload(snapshot, metadata, slotNumber) {
  const slot = snapshot.slots.find((item) => item.slot === slotNumber);
  const meta = metadata[String(slotNumber)] || {};
  return {
    exportedAt: new Date().toISOString(),
    slot: slotNumber,
    device: {
      model: snapshot.model,
      firmware: snapshot.firmware,
      activeSlot: snapshot.activeSlot,
    },
    metadata: meta,
    snapshot: slot,
  };
}

function runBridgeNow(command, payload = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(clientPython, [bridgePath, command, JSON.stringify(payload)], {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `Bridge failed with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Invalid bridge response: ${stdout}`));
      }
    });
  });
}

let deviceQueue = Promise.resolve();

function runBridge(command, payload = {}) {
  const queued = deviceQueue.catch(() => undefined).then(() => runBridgeNow(command, payload));
  deviceQueue = queued.catch(() => undefined);
  return queued;
}

async function fetchReleases() {
  if (releaseCache.payload && Date.now() < releaseCache.expiresAt) {
    return releaseCache.payload;
  }

  const response = await fetch(RELEASES_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "chameleon-ultra-portal",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load releases from GitHub (${response.status}).`);
  }

  const releases = await response.json();
  const normalized = releases.map((release) => ({
    id: release.id,
    name: release.name || release.tag_name,
    tag: release.tag_name,
    isPrerelease: release.prerelease,
    isDraft: release.draft,
    publishedAt: release.published_at,
    url: release.html_url,
    body: release.body || "",
    assets: (release.assets || []).map((asset) => ({
      id: asset.id,
      name: asset.name,
      size: asset.size,
      downloadUrl: asset.browser_download_url,
      contentType: asset.content_type,
    })),
  }));

  const payload = {
    releases: normalized,
    latestStable: normalized.find((release) => !release.isPrerelease && !release.isDraft) || null,
    latestPrerelease: normalized.find((release) => release.isPrerelease && !release.isDraft) || null,
  };

  releaseCache = {
    payload,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  return payload;
}

function preferredAssetName(model, release) {
  const prefix = model?.toLowerCase().includes("lite") ? "lite" : "ultra";
  const preferred = release.assets?.find((asset) => asset.name === `${prefix}-dfu-app.zip`);
  return preferred || release.assets?.find((asset) => asset.name.endsWith("-dfu-app.zip")) || null;
}

async function getUpdaterStatus() {
  const [snapshot, releases] = await Promise.all([runBridge("snapshot"), fetchReleases()]);
  const nrfutilCommand = resolveNrfutil();

  let nrfutil = { installed: false, version: null };
  try {
    const output = await new Promise((resolve, reject) => {
      const child = spawn(nrfutilCommand, ["--version"], { cwd: rootDir, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(stderr.trim() || stdout.trim() || "nrfutil check failed"));
          return;
        }
        resolve(stdout.trim() || stderr.trim());
      });
    });
    nrfutil = { installed: true, version: output };
  } catch {
    nrfutil = { installed: false, version: null };
  }

  const selectableReleases = releases.releases
    .map((release) => ({
      ...release,
      preferredAsset: preferredAssetName(snapshot.model, release),
    }))
    .filter((release) => release.preferredAsset);

  return {
    snapshot,
    nrfutil,
    releases: selectableReleases,
  };
}

async function downloadFirmwareAsset({ assetUrl, filename }) {
  const safeName = path.basename(filename);
  const destination = path.join(downloadsDir, safeName);
  const response = await fetch(assetUrl, {
    headers: {
      Accept: "application/octet-stream",
      "User-Agent": "chameleon-ultra-portal",
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}).`);
  }

  await pipeline(response.body, fs.createWriteStream(destination));

  return {
    path: destination,
    filename: safeName,
  };
}

async function runNrfutilInstall(firmwarePath) {
  const nrfutilCommand = resolveNrfutil();
  return new Promise((resolve, reject) => {
    const child = spawn(nrfutilCommand, ["device", "program", "--firmware", firmwarePath, "--traits", "nordicDfu"], {
      cwd: rootDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const output = `${stdout}\n${stderr}`.trim();
      if (code !== 0) {
        reject(new Error(output || `nrfutil exited with code ${code}`));
        return;
      }
      resolve(output);
    });
  });
}

app.get("/api/snapshot", async (_req, res) => {
  try {
    const snapshot = await runBridge("snapshot");
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/releases", async (_req, res) => {
  try {
    const payload = await fetchReleases();
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/updater/status", async (_req, res) => {
  try {
    const payload = await getUpdaterStatus();
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/slots/metadata", async (_req, res) => {
  try {
    res.json({ slots: readSlotMetadata() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/detect-tag", async (_req, res) => {
  try {
    const detection = await runBridge("detect-tag");
    res.json(detection);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/slots/rename", async (req, res) => {
  try {
    const slot = Number.parseInt(String(req.body.slot), 10);
    const displayName = String(req.body.displayName || "").trim();
    const snapshot = await runBridge("rename-slot", { slot, nickname: displayName });

    const metadata = readSlotMetadata();
    metadata[String(slot)] = {
      ...(metadata[String(slot)] || {}),
      displayName,
      color: metadata[String(slot)]?.color || defaultColors[(slot - 1) % defaultColors.length],
      category: metadata[String(slot)]?.category || "",
      tags: metadata[String(slot)]?.tags || [],
      archived: metadata[String(slot)]?.archived || false,
    };
    writeSlotMetadata(metadata);

    res.json({ snapshot, metadata: metadata[String(slot)] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/slots/metadata", async (req, res) => {
  try {
    const slot = Number.parseInt(String(req.body.slot), 10);
    const metadata = readSlotMetadata();
    metadata[String(slot)] = {
      ...(metadata[String(slot)] || {}),
      displayName: String(req.body.displayName ?? metadata[String(slot)]?.displayName ?? ""),
      category: String(req.body.category ?? metadata[String(slot)]?.category ?? ""),
      tags: Array.isArray(req.body.tags) ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean) : metadata[String(slot)]?.tags || [],
      archived: Boolean(req.body.archived ?? metadata[String(slot)]?.archived),
      color: String(req.body.color ?? metadata[String(slot)]?.color ?? defaultColors[(slot - 1) % defaultColors.length]),
    };
    writeSlotMetadata(metadata);
    res.json({ metadata: metadata[String(slot)] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/slots/duplicate", async (req, res) => {
  try {
    const source = Number.parseInt(String(req.body.sourceSlot), 10);
    const target = Number.parseInt(String(req.body.targetSlot), 10);
    if (source === target) {
      throw new Error("Choose a different target slot for duplication.");
    }

    const metadata = readSlotMetadata();
    const sourceMeta = metadata[String(source)] || {};
    metadata[String(target)] = {
      ...sourceMeta,
      displayName: sourceMeta.displayName ? `${sourceMeta.displayName} Copy` : `Slot ${source} Copy`,
    };
    writeSlotMetadata(metadata);
    res.json({ metadata: metadata[String(target)] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/slots/archive", async (req, res) => {
  try {
    const slot = Number.parseInt(String(req.body.slot), 10);
    const archived = Boolean(req.body.archived);
    const metadata = readSlotMetadata();
    metadata[String(slot)] = {
      ...(metadata[String(slot)] || {}),
      archived,
      color: metadata[String(slot)]?.color || defaultColors[(slot - 1) % defaultColors.length],
      category: metadata[String(slot)]?.category || "",
      tags: metadata[String(slot)]?.tags || [],
      displayName: metadata[String(slot)]?.displayName || "",
    };
    writeSlotMetadata(metadata);
    res.json({ metadata: metadata[String(slot)] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/slots/export", async (req, res) => {
  try {
    const slot = Number.parseInt(String(req.body.slot), 10);
    const snapshot = await runBridge("snapshot");
    const metadata = readSlotMetadata();
    const payload = slotExportPayload(snapshot, metadata, slot);
    const filename = `slot-${slot}-export.json`;
    const destination = path.join(downloadsDir, filename);
    fs.writeFileSync(destination, JSON.stringify(payload, null, 2));
    res.json({ filename, path: destination });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/updater/enter-dfu", async (_req, res) => {
  try {
    const payload = await runBridge("enter-dfu");
    res.json(payload);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/updater/download", async (req, res) => {
  try {
    const payload = await downloadFirmwareAsset({
      assetUrl: req.body.assetUrl,
      filename: req.body.filename,
    });
    res.json(payload);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/updater/install", async (req, res) => {
  try {
    const output = await runNrfutilInstall(req.body.firmwarePath);
    res.json({ ok: true, output });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/mode", async (req, res) => {
  try {
    const snapshot = await runBridge("set-mode", { mode: req.body.mode });
    res.json({ snapshot });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/active-slot", async (req, res) => {
  try {
    const snapshot = await runBridge("set-active-slot", { slot: req.body.slot });
    res.json({ snapshot });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(4174, () => {
  console.log("Chameleon Ultra portal backend running on http://127.0.0.1:4174");
});
