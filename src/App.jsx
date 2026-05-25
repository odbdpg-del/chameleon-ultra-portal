import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CircleDashed,
  Command,
  Cpu,
  FolderCog,
  HardDriveDownload,
  HeartPulse,
  LayoutGrid,
  PackageCheck,
  ScanLine,
  Search,
  Shield,
  Sparkles,
  TerminalSquare,
  Usb,
  Waypoints,
} from "lucide-react";
import {
  DeviceArtwork,
  EventLogPanel,
  FooterBar,
  HeaderBar,
  LiveScanPanel,
  MiniStatCard,
  RadarWidget,
  ReaderActivityPanel,
  Sidebar,
  SnapshotPanel,
  Sparkline,
  SurfacePanel,
  TelemetryPanel,
  ToggleTabs,
} from "./components/ui";
import { SlotExplorer } from "./components/slot-explorer";

const navPrimary = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, target: "dashboard" },
  { id: "slots", label: "Slots", icon: FolderCog, target: "slots" },
  { id: "reader", label: "Reader Mode", icon: ScanLine, target: "reader" },
  { id: "emulator", label: "Emulator Mode", icon: Waypoints, target: "dashboard" },
  { id: "profiles", label: "Profiles", icon: Bot, target: "slots" },
  { id: "diagnostics", label: "Diagnostics", icon: Activity, target: "snapshot" },
  { id: "telemetry", label: "Telemetry", icon: HeartPulse, target: "telemetry" },
  { id: "firmware", label: "Firmware", icon: HardDriveDownload, target: "firmware" },
  { id: "capabilities", label: "Capabilities", icon: Shield, target: "capabilities" },
  { id: "console", label: "Console", icon: TerminalSquare, target: "console" },
  { id: "settings", label: "Settings", icon: CircleDashed, disabled: true },
];

const navSecondary = [
  { id: "support", label: "Support", icon: Shield, disabled: true },
  { id: "about", label: "About", icon: Sparkles, disabled: true },
];

const quickActions = [
  {
    key: "refresh",
    title: "Refresh Snapshot",
    description: "Pull latest device data",
    accent: "blue",
  },
  {
    key: "detect",
    title: "Quick Scan",
    description: "Deep device scan",
    accent: "cyan",
  },
  {
    key: "slot",
    title: "Switch Active Slot",
    description: "Select a different slot",
    accent: "amber",
  },
  {
    key: "reader",
    title: "Reader Mode",
    description: "Enter reader mode",
    accent: "mint",
  },
  {
    key: "emulator",
    title: "Emulator Mode",
    description: "Enter emulator mode",
    accent: "violet",
  },
  {
    key: "sleep",
    title: "Sleep Device",
    description: "Reduce battery usage",
    accent: "gold",
    disabled: true,
  },
  {
    key: "restart",
    title: "Restart Device",
    description: "Reboot the firmware",
    accent: "blue",
    disabled: true,
  },
  {
    key: "badge",
    title: "Detect Badge",
    description: "Scan for HF or LF tag",
    accent: "amber",
  },
  {
    key: "health",
    title: "Health Report",
    description: "Full system diagnostics",
    accent: "mint",
    disabled: true,
  },
];

const slotViewTabs = [
  { value: "inventory", label: "Inventory View" },
  { value: "grid", label: "Grid View" },
];

const slotFilterTabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "hf", label: "HF Loaded" },
  { value: "lf", label: "LF Loaded" },
  { value: "empty", label: "Empty" },
  { value: "archived", label: "Archived" },
];

const autoRefreshOptions = [6, 10, 15, 30];

const manualCapabilityFilters = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "partial", label: "Partial" },
  { value: "planned", label: "Planned" },
  { value: "restricted", label: "Restricted" },
];

const manualCapabilityGroups = [
  {
    id: "setup",
    title: "Setup and Connectivity",
    items: [
      {
        name: "USB connection and device presence",
        status: "available",
        detail: "Live USB status, port identity, and snapshot refresh are already wired into the portal.",
      },
      {
        name: "Firmware update workflow",
        status: "available",
        detail: "Release selection, package download, DFU handoff, and installer status are available in Firmware Center.",
      },
      {
        name: "BLE connection visibility",
        status: "partial",
        detail: "The UI has a placeholder, but full BLE pairing state depends on what the firmware exposes.",
      },
      {
        name: "Charging, battery, and power health",
        status: "available",
        detail: "Battery level, voltage trend, live telemetry, and status cards are already present.",
      },
    ],
  },
  {
    id: "reader",
    title: "Reader and Scan Features",
    items: [
      {
        name: "HF and LF scan detection",
        status: "available",
        detail: "Reader dashboard, detection history, protocol family, frequency, and UID presence are already in the app.",
      },
      {
        name: "Supported card family visibility",
        status: "planned",
        detail: "We can add a fuller compatibility matrix for LF and HF families directly from the manual.",
      },
      {
        name: "Signal quality and RF environment display",
        status: "partial",
        detail: "The portal has modeled signal visuals today, but real signal telemetry is limited by device firmware exposure.",
      },
      {
        name: "Troubleshooting guidance for scan failures",
        status: "planned",
        detail: "The manual has useful reader troubleshooting that we can surface as contextual help in the UI.",
      },
    ],
  },
  {
    id: "emulation",
    title: "Emulation and Slot Control",
    items: [
      {
        name: "Reader and emulator mode switching",
        status: "available",
        detail: "Mode switching, active slot changes, slot labeling, and slot inventory views are live now.",
      },
      {
        name: "Profile inventory, naming, tags, and archive state",
        status: "available",
        detail: "Slots can already be renamed, tagged, filtered, duplicated locally, exported, and archived in the portal.",
      },
      {
        name: "Manual feature map for LF/HF simulation support",
        status: "planned",
        detail: "We can add a richer per-slot compatibility view for MIFARE, NTAG, EM410x, HID, and other families listed in the manual.",
      },
    ],
  },
  {
    id: "diagnostics",
    title: "Health and Diagnostics",
    items: [
      {
        name: "Device event log and activity timeline",
        status: "available",
        detail: "Local action log, scan history, telemetry pulse, and exportable event trail are already present.",
      },
      {
        name: "Temperature, uptime, and system health",
        status: "partial",
        detail: "These fields are rendered, but some are still placeholders when the firmware does not report them.",
      },
      {
        name: "Manual troubleshooting center",
        status: "planned",
        detail: "We can add guided checks for power, drivers, positioning, supported tags, and firmware mismatch issues.",
      },
    ],
  },
  {
    id: "restricted",
    title: "Restricted Workflows",
    items: [
      {
        name: "Credential cloning and copy-to-tag flows",
        status: "restricted",
        detail: "I am not wiring badge-copy or tag-duplication workflows into the portal.",
      },
      {
        name: "Attack tooling such as brute force, darkside, nested, hardnested, sniffing, or relay",
        status: "restricted",
        detail: "Those workflows will stay out of the portal even if the manual mentions them.",
      },
    ],
  },
];

function formatScanTime(value) {
  if (!value) return "Waiting for scan";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Waiting for scan";
  return parsed.toLocaleString();
}

function formatTimeOnly(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleTimeString();
}

function normalizeVersion(input) {
  return String(input || "")
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}

function compareVersions(left, right) {
  const a = normalizeVersion(left);
  const b = normalizeVersion(right);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = a[index] ?? 0;
    const rightPart = b[index] ?? 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return 0;
}

function summarizeRelease(body) {
  const clean = String(body || "")
    .replace(/[`#>*_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "No release notes summary available.";
  return clean.slice(0, 220) + (clean.length > 220 ? "..." : "");
}

function relativeMinutesSeries(length, floor, ceiling) {
  const range = ceiling - floor;
  return Array.from({ length }, (_, index) => {
    const wave = Math.sin(index * 0.62) * 0.38 + Math.cos(index * 0.27) * 0.18;
    return Math.round(floor + range * (0.46 + wave * 0.34));
  });
}

function signalMood(latestScan) {
  if (latestScan?.protocolFamily === "High Frequency") {
    return { hf: "Excellent", lf: "Idle", hfDbm: "-42 dBm", lfDbm: "--" };
  }
  if (latestScan?.protocolFamily === "Low Frequency") {
    return { hf: "Idle", lf: "Good", hfDbm: "--", lfDbm: "-68 dBm" };
  }
  return { hf: "Searching", lf: "Searching", hfDbm: "--", lfDbm: "--" };
}

export default function App() {
  const [snapshot, setSnapshot] = useState(null);
  const [releaseInfo, setReleaseInfo] = useState(null);
  const [selectedReleaseTag, setSelectedReleaseTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [detection, setDetection] = useState(null);
  const [updater, setUpdater] = useState(null);
  const [downloadedFirmware, setDownloadedFirmware] = useState(null);
  const [installLog, setInstallLog] = useState("");
  const [slotMetadata, setSlotMetadata] = useState({});
  const [scanHistory, setScanHistory] = useState([]);
  const [batteryHistory, setBatteryHistory] = useState([]);
  const [voltageHistory, setVoltageHistory] = useState([]);
  const [lastTelemetryAt, setLastTelemetryAt] = useState(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState("dashboard");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10);
  const [slotViewMode, setSlotViewMode] = useState("inventory");
  const [slotSearchQuery, setSlotSearchQuery] = useState("");
  const [slotFilter, setSlotFilter] = useState("all");
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [manualFilter, setManualFilter] = useState("all");
  const [compactMode, setCompactMode] = useState(false);
  const [scanPulseAt, setScanPulseAt] = useState(0);
  const [consoleUnlocked, setConsoleUnlocked] = useState(false);
  const [consoleInput, setConsoleInput] = useState("");
  const [consoleHistory, setConsoleHistory] = useState([
    {
      id: "console-welcome",
      kind: "system",
      text: "Portal console ready. Type 'help' to view safe device commands.",
    },
  ]);
  const [eventLog, setEventLog] = useState([]);
  const [collapsedPanels, setCollapsedPanels] = useState({
    actions: false,
    snapshot: false,
    telemetry: false,
    slots: false,
    reader: false,
    firmware: false,
    capabilities: false,
    console: true,
  });

  function logEvent(title, detail, tone = "info") {
    setEventLog((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        title,
        detail,
        tone,
        timestamp: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 14));
  }

  function appendConsoleEntry(kind, text) {
    setConsoleHistory((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        kind,
        text,
      },
    ].slice(-48));
  }

  function recordTelemetry(nextSnapshot) {
    if (!nextSnapshot?.battery) return;
    const stamp = Date.now();
    setLastTelemetryAt(stamp);
    setBatteryHistory((current) => [...current, { t: stamp, v: nextSnapshot.battery.percent }].slice(-24));
    setVoltageHistory((current) => [...current, { t: stamp, v: Number.parseFloat(nextSnapshot.battery.voltage) }].slice(-24));
  }

  async function fetchSnapshot({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const snapshotResponse = await fetch("/api/snapshot");
      const snapshotPayload = await snapshotResponse.json();
      if (!snapshotResponse.ok) {
        throw new Error(snapshotPayload.error || "Unable to load snapshot.");
      }
      setSnapshot(snapshotPayload);
      recordTelemetry(snapshotPayload);
      if (!silent) {
        logEvent("Snapshot refreshed", `${snapshotPayload.mode} mode | Battery ${snapshotPayload.battery.percent}%`);
      }
      return snapshotPayload;
    } catch (err) {
      if (!silent) {
        setError(err.message);
        logEvent("Snapshot failed", err.message, "warn");
      }
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function fetchStaticData() {
    setError("");
    try {
      const [releasesResponse, updaterResponse] = await Promise.all([
        fetch("/api/releases"),
        fetch("/api/updater/status"),
      ]);
      const slotMetadataResponse = await fetch("/api/slots/metadata");

      const releasesPayload = await releasesResponse.json();
      const updaterPayload = await updaterResponse.json();
      const slotMetadataPayload = await slotMetadataResponse.json();

      if (!releasesResponse.ok) {
        throw new Error(releasesPayload.error || "Unable to load releases.");
      }

      setReleaseInfo(releasesPayload);
      setSelectedReleaseTag((current) => current || releasesPayload.latestStable?.tag || releasesPayload.releases?.[0]?.tag || "");

      if (updaterResponse.ok) {
        setUpdater(updaterPayload);
      }
      if (slotMetadataResponse.ok) {
        setSlotMetadata(slotMetadataPayload.slots || {});
      }
    } catch (err) {
      setError(err.message);
      logEvent("Static data failed", err.message, "warn");
    }
  }

  async function fetchPortalData() {
    setLoading(true);
    await fetchSnapshot({ silent: false });
    await fetchStaticData();
    setLoading(false);
  }

  async function runUpdaterAction(path, body, onSuccess) {
    setBusyAction(path);
    setError("");
    try {
      const response = await fetch(`/api/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Updater action failed.");
      }
      onSuccess?.(payload);
      const actionName = path.split("/").pop()?.replace("-", " ") || "updater action";
      logEvent("Firmware action", actionName);
      return payload;
    } catch (err) {
      setError(err.message);
      logEvent("Firmware action failed", err.message, "warn");
      return null;
    } finally {
      setBusyAction("");
    }
  }

  async function postAction(path, body, successMessage) {
    setBusyAction(path);
    setError("");
    try {
      const response = await fetch(`/api/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Action failed.");
      }
      setToast(successMessage);
      setSnapshot(payload.snapshot);
      recordTelemetry(payload.snapshot);

      if (path === "mode") {
        logEvent("Mode changed", payload.snapshot.mode === "Reader" ? "Reader mode enabled" : "Emulator mode enabled", "good");
      } else if (path === "active-slot") {
        logEvent("Slot activated", `Slot ${payload.snapshot.activeSlot} is now active`, "good");
      } else {
        logEvent("Action completed", successMessage, "good");
      }

      window.setTimeout(() => setToast(""), 2500);
      return payload;
    } catch (err) {
      setError(err.message);
      logEvent("Action failed", err.message, "warn");
      return null;
    } finally {
      setBusyAction("");
    }
  }

  async function detectTag() {
    setBusyAction("detect-tag");
    setError("");
    try {
      const response = await fetch("/api/detect-tag", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Detection failed.");
      }
      setDetection(payload);
      setScanHistory((current) => [payload, ...current].slice(0, 8));
      setScanPulseAt(Date.now());
      setToast(payload.summary);
      logEvent(
        payload.detected ? "Tag detected" : "No tag detected",
        payload.detected ? `${payload.technology || payload.family} | ${payload.frequency || "Unknown band"}` : payload.summary,
        payload.detected ? "good" : "warn",
      );
      window.setTimeout(() => setToast(""), 2500);
      return payload;
    } catch (err) {
      setError(err.message);
      logEvent("Detection failed", err.message, "warn");
      return null;
    } finally {
      setBusyAction("");
    }
  }

  async function saveSlot(slotNumber, updates) {
    setBusyAction(`slot-save-${slotNumber}`);
    setError("");
    try {
      const metadataResponse = await fetch("/api/slots/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: slotNumber, ...updates }),
      });
      const metadataPayload = await metadataResponse.json();
      if (!metadataResponse.ok) {
        throw new Error(metadataPayload.error || "Unable to save slot metadata.");
      }
      setSlotMetadata((current) => ({
        ...current,
        [String(slotNumber)]: metadataPayload.metadata,
      }));

      if (Object.prototype.hasOwnProperty.call(updates, "displayName")) {
        const renameResponse = await fetch("/api/slots/rename", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot: slotNumber, displayName: updates.displayName }),
        });
        const renamePayload = await renameResponse.json();
        if (!renameResponse.ok) {
          throw new Error(renamePayload.error || "Unable to rename slot.");
        }
        setSnapshot(renamePayload.snapshot);
      }

      setToast(`Saved slot ${slotNumber}.`);
      logEvent("Slot updated", `Slot ${slotNumber} metadata saved`, "good");
      window.setTimeout(() => setToast(""), 2200);
    } catch (err) {
      setError(err.message);
      logEvent("Slot update failed", err.message, "warn");
    } finally {
      setBusyAction("");
    }
  }

  async function duplicateSlot(sourceSlot) {
    const targetSlotRaw = window.prompt(`Duplicate slot ${sourceSlot} metadata to which slot?`, "");
    const targetSlot = Number.parseInt(String(targetSlotRaw || ""), 10);
    if (!Number.isFinite(targetSlot) || targetSlot < 1 || targetSlot > 8) {
      return;
    }

    setBusyAction(`slot-duplicate-${sourceSlot}`);
    setError("");
    try {
      const response = await fetch("/api/slots/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceSlot, targetSlot }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to duplicate slot metadata.");
      }
      setSlotMetadata((current) => ({
        ...current,
        [String(targetSlot)]: payload.metadata,
      }));
      setToast(`Copied slot ${sourceSlot} metadata to slot ${targetSlot}.`);
      logEvent("Slot duplicated", `Copied slot ${sourceSlot} metadata to slot ${targetSlot}`);
      window.setTimeout(() => setToast(""), 2200);
    } catch (err) {
      setError(err.message);
      logEvent("Slot duplication failed", err.message, "warn");
    } finally {
      setBusyAction("");
    }
  }

  async function exportSlot(slotNumber) {
    setBusyAction(`slot-export-${slotNumber}`);
    setError("");
    try {
      const response = await fetch("/api/slots/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: slotNumber }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to export slot.");
      }
      setToast(`Exported ${payload.filename}`);
      logEvent("Slot exported", payload.filename);
      window.setTimeout(() => setToast(""), 2200);
      return payload;
    } catch (err) {
      setError(err.message);
      logEvent("Slot export failed", err.message, "warn");
      return null;
    } finally {
      setBusyAction("");
    }
  }

  async function archiveSlot(slotNumber, archived) {
    setBusyAction(`slot-archive-${slotNumber}`);
    setError("");
    try {
      const response = await fetch("/api/slots/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: slotNumber, archived }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update archive state.");
      }
      setSlotMetadata((current) => ({
        ...current,
        [String(slotNumber)]: payload.metadata,
      }));
      setToast(archived ? `Archived slot ${slotNumber}.` : `Restored slot ${slotNumber}.`);
      logEvent(archived ? "Slot archived" : "Slot restored", `Slot ${slotNumber}`);
      window.setTimeout(() => setToast(""), 2200);
    } catch (err) {
      setError(err.message);
      logEvent("Archive update failed", err.message, "warn");
    } finally {
      setBusyAction("");
    }
  }

  function handleQuickAction(actionKey) {
    if (actionKey === "refresh") {
      fetchPortalData();
      return;
    }
    if (actionKey === "detect" || actionKey === "badge") {
      detectTag();
      return;
    }
    if (actionKey === "reader") {
      postAction("mode", { mode: "reader" }, "Switched to reader mode.");
      return;
    }
    if (actionKey === "emulator") {
      postAction("mode", { mode: "emulator" }, "Switched to emulator mode.");
      return;
    }
    if (actionKey === "slot" && snapshot?.activeSlot) {
      const nextSlot = snapshot.activeSlot >= 8 ? 1 : snapshot.activeSlot + 1;
      postAction("active-slot", { slot: nextSlot }, `Slot ${nextSlot} is now active.`);
      return;
    }
    setToast("This control is visual-only in the current build.");
    window.setTimeout(() => setToast(""), 2000);
  }

  function jumpToSection(sectionId, navId) {
    setActiveSidebarItem(navId);
    const node = document.getElementById(sectionId);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function togglePanel(panelKey) {
    setCollapsedPanels((current) => ({
      ...current,
      [panelKey]: !current[panelKey],
    }));
  }

  function clearScanHistory() {
    setScanHistory([]);
    setDetection(null);
    logEvent("Reader history cleared", "Recent scan timeline was reset.");
  }

  function exportEventLog() {
    const blob = new Blob([JSON.stringify(eventLog, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chameleon-event-log-${Date.now()}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    logEvent("Event log exported", "Saved local action trail.");
  }

  async function executeConsoleCommand(rawCommand) {
    const command = String(rawCommand || "").trim();
    if (!command) return;
    const normalizedCommand = command.startsWith("/") ? command.slice(1).trim() : command;
    if (!normalizedCommand) return;

    appendConsoleEntry("input", `> ${command}`);
    const normalized = normalizedCommand.toLowerCase();
    const parts = normalized.split(/\s+/);

    if (normalized === "help") {
      appendConsoleEntry(
        "system",
        "Available commands: help, status, refresh, detect, mode reader, mode emulator, slot list, slot activate <1-8>, slot export <1-8>, firmware status, updater status, releases, clear.",
      );
      return;
    }

    if (normalized === "clear") {
      setConsoleHistory([
        {
          id: `${Date.now()}-console-cleared`,
          kind: "system",
          text: "Console cleared. Type 'help' to view safe device commands.",
        },
      ]);
      return;
    }

    if (
      normalized.includes("clone") ||
      normalized.includes("copy badge") ||
      normalized.includes("copy card") ||
      normalized.includes("nested") ||
      normalized.includes("darkside") ||
      normalized.includes("hardnested") ||
      normalized.includes("relay") ||
      normalized.includes("sniff") ||
      normalized.includes("brute")
    ) {
      appendConsoleEntry("warn", "That workflow is intentionally unavailable in the portal console.");
      return;
    }

    if (normalized === "status" || normalized === "refresh") {
      const nextSnapshot = await fetchSnapshot({ silent: false });
      if (nextSnapshot) {
        appendConsoleEntry(
          "ok",
          `Mode ${nextSnapshot.mode} | Slot ${nextSnapshot.activeSlot} | Battery ${nextSnapshot.battery.percent}% | Port ${nextSnapshot.port || "offline"}`,
        );
      }
      return;
    }

    if (normalized === "detect") {
      const payload = await detectTag();
      if (payload) {
        appendConsoleEntry("ok", payload.summary);
      }
      return;
    }

    if (normalized === "mode reader" || normalized === "mode emulator") {
      const nextMode = normalized.endsWith("reader") ? "reader" : "emulator";
      const payload = await postAction("mode", { mode: nextMode }, `Switched to ${nextMode} mode.`);
      if (payload?.snapshot) {
        appendConsoleEntry("ok", `Device now in ${payload.snapshot.mode} mode.`);
      }
      return;
    }

    if (normalized === "slot list") {
      if (!mergedSlots.length) {
        appendConsoleEntry("warn", "No slot snapshot is loaded yet.");
        return;
      }
      appendConsoleEntry(
        "system",
        mergedSlots
          .map((slot) => `${slot.slot}: ${slot.displayName || slot.nick || "Unnamed"} [HF ${slot.hf.type} | LF ${slot.lf.type}]`)
          .join(" || "),
      );
      return;
    }

    if (parts[0] === "slot" && parts[1] === "activate") {
      const targetSlot = Number.parseInt(parts[2] || "", 10);
      if (!Number.isFinite(targetSlot) || targetSlot < 1 || targetSlot > 8) {
        appendConsoleEntry("warn", "Use: slot activate <1-8>");
        return;
      }
      const payload = await postAction("active-slot", { slot: targetSlot }, `Slot ${targetSlot} is now active.`);
      if (payload?.snapshot) {
        appendConsoleEntry("ok", `Active slot changed to ${payload.snapshot.activeSlot}.`);
      }
      return;
    }

    if (parts[0] === "slot" && parts[1] === "export") {
      const targetSlot = Number.parseInt(parts[2] || "", 10);
      if (!Number.isFinite(targetSlot) || targetSlot < 1 || targetSlot > 8) {
        appendConsoleEntry("warn", "Use: slot export <1-8>");
        return;
      }
      const payload = await exportSlot(targetSlot);
      if (payload) {
        appendConsoleEntry("ok", `Exported ${payload.filename}.`);
      }
      return;
    }

    if (normalized === "firmware status") {
      appendConsoleEntry(
        "system",
        `Installed ${snapshot?.firmware || "--"} | Target ${selectedRelease?.tag || "--"} | ${firmwareStatus?.label || "No comparison available"}`,
      );
      return;
    }

    if (normalized === "updater status") {
      appendConsoleEntry(
        updater?.nrfutil?.installed ? "ok" : "warn",
        updater?.nrfutil?.installed
          ? `nrfutil ${updater.nrfutil.version || "installed"} is ready.`
          : "nrfutil is not installed.",
      );
      return;
    }

    if (normalized === "releases") {
      appendConsoleEntry(
        "system",
        (releaseInfo?.releases || [])
          .slice(0, 6)
          .map((release) => release.tag)
          .join(", ") || "No release data loaded.",
      );
      return;
    }

    appendConsoleEntry("warn", "Unknown command. Type 'help' to view available console commands.");
  }

  useEffect(() => {
    fetchPortalData();
  }, []);

  useEffect(() => {
    function handleConsoleToggle(event) {
      if (event.key !== "`") return;
      const target = event.target;
      const isTypingSurface =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTypingSurface) return;

      event.preventDefault();
      setConsoleUnlocked((current) => {
        const next = !current;
        setToast(next ? "Console unlocked." : "Console hidden.");
        window.setTimeout(() => setToast(""), 2200);
        if (!next && activeSidebarItem === "console") {
          setActiveSidebarItem("dashboard");
          document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (next) {
          window.setTimeout(() => {
            document.getElementById("console")?.scrollIntoView({ behavior: "smooth", block: "start" });
            setActiveSidebarItem("console");
          }, 60);
        }
        return next;
      });
    }

    window.addEventListener("keydown", handleConsoleToggle);
    return () => window.removeEventListener("keydown", handleConsoleToggle);
  }, [activeSidebarItem]);

  useEffect(() => {
    if (!autoRefreshEnabled) return undefined;
    const timer = window.setInterval(() => {
      fetchSnapshot({ silent: true });
    }, autoRefreshInterval * 1000);
    return () => window.clearInterval(timer);
  }, [autoRefreshEnabled, autoRefreshInterval]);

  useEffect(() => {
    const trackedSections = [
      { node: document.getElementById("dashboard"), navId: "dashboard" },
      { node: document.getElementById("telemetry"), navId: "telemetry" },
      { node: document.getElementById("slots"), navId: "slots" },
      { node: document.getElementById("reader"), navId: "reader" },
      { node: document.getElementById("firmware"), navId: "firmware" },
      { node: document.getElementById("capabilities"), navId: "capabilities" },
      ...(consoleUnlocked ? [{ node: document.getElementById("console"), navId: "console" }] : []),
    ].filter((entry) => entry.node);

    if (!trackedSections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (!visible) return;
        const match = trackedSections.find((entry) => entry.node === visible.target);
        if (match) {
          setActiveSidebarItem(match.navId);
        }
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-15% 0px -45% 0px" },
    );

    trackedSections.forEach((entry) => observer.observe(entry.node));
    return () => observer.disconnect();
  }, [snapshot, slotMetadata, scanHistory.length, autoRefreshEnabled, autoRefreshInterval, consoleUnlocked]);

  const selectedRelease = useMemo(
    () => releaseInfo?.releases?.find((release) => release.tag === selectedReleaseTag) || releaseInfo?.latestStable || null,
    [releaseInfo, selectedReleaseTag],
  );

  const selectedFirmwareAsset = useMemo(() => {
    if (!selectedRelease || !snapshot?.model) return null;
    const prefix = snapshot.model.toLowerCase().includes("lite") ? "lite" : "ultra";
    return (
      selectedRelease.assets?.find((asset) => asset.name === `${prefix}-dfu-app.zip`) ||
      selectedRelease.assets?.find((asset) => asset.name.endsWith("-dfu-app.zip")) ||
      null
    );
  }, [selectedRelease, snapshot]);

  const firmwareStatus = useMemo(() => {
    if (!snapshot?.firmware || !selectedRelease?.tag) {
      return null;
    }

    const current = snapshot.firmware;
    const target = selectedRelease.tag;
    const comparison = compareVersions(current, target);

    if (comparison < 0) {
      return {
        tone: "warn",
        label: "Update available",
        detail: `${current} is behind ${target}`,
      };
    }
    if (comparison === 0) {
      return {
        tone: "good",
        label: "Up to date",
        detail: `${current} matches ${target}`,
      };
    }
    return {
      tone: "default",
      label: "Ahead of selected target",
      detail: `${current} is newer than ${target}`,
    };
  }, [selectedRelease, snapshot]);

  const batteryPercentValues = useMemo(() => batteryHistory.map((sample) => sample.v), [batteryHistory]);
  const voltageValues = useMemo(() => voltageHistory.map((sample) => sample.v), [voltageHistory]);
  const temperatureValues = useMemo(() => relativeMinutesSeries(24, 27, 36), []);
  const pulseValues = useMemo(
    () => scanHistory.map((scan, index) => (scan.detected ? 74 - index * 4 : 28 + index * 2)).concat(relativeMinutesSeries(12, 24, 66)).slice(0, 24),
    [scanHistory],
  );
  const telemetry = snapshot?.telemetry || {};
  const lastTelemetryLabel = lastTelemetryAt ? new Date(lastTelemetryAt).toLocaleTimeString() : "No samples yet";
  const latestScan = detection || scanHistory[0] || null;
  const mergedSlots = useMemo(
    () =>
      (snapshot?.slots || []).map((slot) => ({
        ...slot,
        ...(slotMetadata[String(slot.slot)] || {}),
      })),
    [slotMetadata, snapshot],
  );

  const filteredSlots = useMemo(() => {
    const query = slotSearchQuery.trim().toLowerCase();
    return mergedSlots
      .filter((slot) => {
        if (slotFilter === "active") return snapshot?.activeSlot === slot.slot;
        if (slotFilter === "hf") return slot.hf.type !== "UNDEFINED";
        if (slotFilter === "lf") return slot.lf.type !== "UNDEFINED";
        if (slotFilter === "empty") return slot.hf.type === "UNDEFINED" && slot.lf.type === "UNDEFINED";
        if (slotFilter === "archived") return Boolean(slot.archived);
        return true;
      })
      .filter((slot) => {
        if (!query) return true;
        return [
          slot.displayName,
          slot.nick,
          slot.category,
          slot.hf.type,
          slot.lf.type,
          ...(slot.tags || []),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
  }, [mergedSlots, slotFilter, slotSearchQuery, snapshot?.activeSlot]);

  const slotStats = useMemo(() => {
    const hfLoaded = mergedSlots.filter((slot) => slot.hf.type !== "UNDEFINED").length;
    const lfLoaded = mergedSlots.filter((slot) => slot.lf.type !== "UNDEFINED").length;
    return { hfLoaded, lfLoaded };
  }, [mergedSlots]);

  const signalState = signalMood(latestScan);
  const heroMode = snapshot?.mode || "Unavailable";
  const connectionLabel = snapshot?.port ? `Connected to ${snapshot.port}` : "Waiting for device";
  const connectionTone = snapshot ? "good" : "warn";
  const firmwarePublished = selectedRelease?.publishedAt ? new Date(selectedRelease.publishedAt).toLocaleDateString() : "--";
  const releaseSummary = selectedRelease ? summarizeRelease(selectedRelease.body) : "Select a release target to inspect firmware details.";
  const footerTime = formatTimeOnly(latestScan?.scanTimestamp || lastTelemetryAt || new Date().toISOString());
  const filteredCapabilityGroups = useMemo(() => {
    const query = manualSearchQuery.trim().toLowerCase();
    return manualCapabilityGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const matchesFilter = manualFilter === "all" ? true : item.status === manualFilter;
          const matchesQuery = !query
            ? true
            : `${item.name} ${item.detail} ${group.title}`.toLowerCase().includes(query);
          return matchesFilter && matchesQuery;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [manualFilter, manualSearchQuery]);
  const visibleNavPrimary = useMemo(
    () => navPrimary.filter((item) => item.id !== "console" || consoleUnlocked),
    [consoleUnlocked],
  );

  return (
    <div className={`portal-app ${compactMode ? "portal-app--compact" : ""}`.trim()}>
      <Sidebar
        primaryItems={visibleNavPrimary}
        secondaryItems={navSecondary}
        activeItem={activeSidebarItem}
        snapshot={snapshot}
        onSelect={(item) => {
          if (item.disabled) return;
          jumpToSection(item.target, item.id);
        }}
      />

      <div className="portal-main">
        <HeaderBar
          connected={Boolean(snapshot)}
          connectionLabel={connectionLabel}
          onQuickConnect={() => fetchPortalData()}
          onScan={detectTag}
          scanBusy={busyAction === "detect-tag"}
          compactMode={compactMode}
          onToggleCompactMode={() => setCompactMode((current) => !current)}
        />

        {error ? <div className="banner banner--error">{error}</div> : null}
        {toast ? <div className="banner banner--success">{toast}</div> : null}

        <div className="portal-scroll">
          <section id="dashboard" className="dashboard-section dashboard-section--hero">
            <SurfacePanel className="hero-shell">
              <div className="hero-shell__content">
                <div className="hero-shell__eyebrow">Connected via USB</div>
                <h1>Chameleon Ultra Portal</h1>
                <p>A modern control center for your Chameleon Ultra device.</p>
              </div>
              <div className="hero-shell__art">
                <DeviceArtwork />
              </div>
              <div className="hero-shell__mode">
                <div className="hero-mode__label">Current mode</div>
                <div className="hero-mode__value">{heroMode}</div>
                <p>{heroMode === "Reader" ? "Device is in active reader mode." : "Device is emulating the selected slot."}</p>
                <button
                  className={`hero-mode__button ${heroMode === "Reader" ? "hero-mode__button--violet" : "hero-mode__button--mint"}`}
                  onClick={() =>
                    postAction(
                      "mode",
                      { mode: heroMode === "Reader" ? "emulator" : "reader" },
                      heroMode === "Reader" ? "Switched to emulator mode." : "Switched to reader mode.",
                    )
                  }
                >
                  {heroMode === "Reader" ? "Switch to Emulator Mode" : "Switch to Reader Mode"}
                </button>
              </div>
            </SurfacePanel>

            <div className="kpi-grid">
              <MiniStatCard icon={HeartPulse} label="Battery" value={snapshot ? `${snapshot.battery.percent}%` : "--"} hint={snapshot ? `${snapshot.battery.voltage} V` : "Waiting for device"} accent="mint" progress={snapshot?.battery?.percent || 0} />
              <MiniStatCard icon={Waypoints} label="Active Slot" value={snapshot?.activeSlot || "--"} hint={mergedSlots.find((slot) => slot.slot === snapshot?.activeSlot)?.displayName || mergedSlots.find((slot) => slot.slot === snapshot?.activeSlot)?.nick || "No slot selected"} accent="cyan" />
              <MiniStatCard icon={FolderCog} label="Profiles Loaded" value={snapshot?.slots?.length || 0} hint={`HF: ${slotStats.hfLoaded} | LF: ${slotStats.lfLoaded}`} accent="blue" />
              <MiniStatCard icon={Cpu} label="Firmware" value={snapshot?.firmware || "--"} hint={firmwareStatus?.label || "Awaiting comparison"} accent="mint" />
              <MiniStatCard icon={Usb} label="Connection" value={snapshot?.port ? "USB" : "Offline"} hint={snapshot?.port || "No port"} accent="amber" />
            </div>
          </section>

          <section className="dashboard-grid dashboard-grid--overview">
            <SurfacePanel id="actions" className="surface-panel--dense">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Quick Actions</p>
                  <h2>Control center</h2>
                </div>
                <button className="panel-link" onClick={() => togglePanel("actions")}>
                  {collapsedPanels.actions ? "Expand" : "Collapse"}
                </button>
              </div>
              {!collapsedPanels.actions ? (
                <>
                  <div className="action-grid">
                    {quickActions.map((item) => (
                      <button
                        key={item.key}
                        className={`action-tile action-tile--${item.accent}`}
                        disabled={Boolean(busyAction) || item.disabled}
                        onClick={() => handleQuickAction(item.key)}
                      >
                        <span className="action-tile__title">{item.title}</span>
                        <span className="action-tile__text">{item.description}</span>
                      </button>
                    ))}
                  </div>
                  <div className="shortcut-row">
                    <span className="shortcut-chip">Console</span>
                    <span className="shortcut-chip">API Inspector</span>
                    <span className="shortcut-chip">Live Events</span>
                    <span className="shortcut-chip">Export Snapshot</span>
                  </div>
                </>
              ) : null}
            </SurfacePanel>

            <SnapshotPanel
              id="snapshot"
              snapshot={snapshot}
              telemetry={telemetry}
              latestSample={lastTelemetryLabel}
              signalState={signalState}
              collapsed={collapsedPanels.snapshot}
              onToggleCollapse={() => togglePanel("snapshot")}
            />
          </section>

          <section id="telemetry" className="dashboard-section">
            <TelemetryPanel
              autoRefreshEnabled={autoRefreshEnabled}
              autoRefreshInterval={autoRefreshInterval}
              intervals={autoRefreshOptions}
              onToggleAutoRefresh={() => setAutoRefreshEnabled((current) => !current)}
              onChangeInterval={(event) => setAutoRefreshInterval(Number.parseInt(event.target.value, 10))}
              collapsed={collapsedPanels.telemetry}
              onToggleCollapse={() => togglePanel("telemetry")}
              cards={[
                {
                  label: "Battery Over Time",
                  value: snapshot?.battery ? `${snapshot.battery.percent}%` : "--",
                  hint: snapshot?.battery ? `${snapshot.battery.voltage} V` : "Waiting for sample",
                  chart: <Sparkline values={batteryPercentValues} stroke="#18e7d2" />,
                },
                {
                  label: "Voltage Trend",
                  value: snapshot?.battery?.voltage ? `${snapshot.battery.voltage} V` : "--",
                  hint: "Rolling voltage samples",
                  chart: <Sparkline values={voltageValues} stroke="#f9a43f" />,
                },
                {
                  label: "Temperature",
                  value: telemetry.temperatureC ? `${telemetry.temperatureC} C` : "31.4 C",
                  hint: telemetry.temperatureC ? "Device-reported temperature" : "Not exposed by firmware",
                  chart: <Sparkline values={temperatureValues} stroke="#39b7ff" />,
                },
                {
                  label: "Portal Pulse",
                  value: snapshot ? "Streaming" : "Idle",
                  hint: "Polling heartbeat and scan rhythm",
                  chart: <Sparkline values={pulseValues} stroke="#9e6bff" />,
                },
              ]}
            />
          </section>

          <section id="slots" className="dashboard-section">
            <SurfacePanel className="surface-panel--dense">
              <div className="panel-heading panel-heading--slots">
                <div>
                  <p className="panel-kicker">Slot Explorer / Visualizer</p>
                  <h2>Inventory dashboard</h2>
                </div>
                <div className="slot-toolbar">
                  <ToggleTabs tabs={slotViewTabs} value={slotViewMode} onChange={setSlotViewMode} />
                  <label className="search-field">
                    <Search size={14} />
                    <input
                      value={slotSearchQuery}
                      onChange={(event) => setSlotSearchQuery(event.target.value)}
                      placeholder="Search slots..."
                    />
                  </label>
                  <div className="filter-chips">
                    {slotFilterTabs.map((filter) => (
                      <button
                        key={filter.value}
                        className={`filter-chip ${slotFilter === filter.value ? "filter-chip--active" : ""}`}
                        onClick={() => setSlotFilter(filter.value)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <button className="toolbar-button" disabled>
                    Import
                  </button>
                  <button className="toolbar-button" onClick={() => exportSlot(snapshot?.activeSlot || 1)} disabled={!snapshot?.activeSlot || Boolean(busyAction)}>
                    Export
                  </button>
                  <button className="toolbar-button toolbar-button--primary" disabled>
                    New Profile
                  </button>
                  <button className="toolbar-button" onClick={() => togglePanel("slots")}>
                    {collapsedPanels.slots ? "Expand" : "Collapse"}
                  </button>
                </div>
              </div>

              {!collapsedPanels.slots ? (
                <>
                  <SlotExplorer
                    viewMode={slotViewMode}
                    slots={filteredSlots}
                    activeSlot={snapshot?.activeSlot}
                    busyAction={busyAction}
                    compactMode={compactMode}
                    onActivate={(targetSlot) =>
                      postAction("active-slot", { slot: targetSlot }, `Slot ${targetSlot} is now active.`)
                    }
                    onSave={saveSlot}
                    onDuplicate={duplicateSlot}
                    onExport={exportSlot}
                    onArchive={archiveSlot}
                  />

                  <div className="legend-row">
                    <span>HF: High Frequency (13.56 MHz)</span>
                    <span>LF: Low Frequency (125 kHz)</span>
                    <span className="legend-dot legend-dot--active">Active</span>
                    <span className="legend-dot legend-dot--enabled">Enabled</span>
                    <span className="legend-dot legend-dot--disabled">Disabled</span>
                    <span className="legend-dot legend-dot--empty">Empty</span>
                  </div>
                </>
              ) : null}
            </SurfacePanel>
          </section>

          <section id="reader" className="dashboard-grid dashboard-grid--bottom">
            <LiveScanPanel
              latestScan={latestScan}
              mode={snapshot?.mode}
              onDetect={detectTag}
              busy={busyAction === "detect-tag"}
              collapsed={collapsedPanels.reader}
              onToggleCollapse={() => togglePanel("reader")}
              pulseActive={Boolean(scanPulseAt)}
              radar={<RadarWidget mode={snapshot?.mode} latestScan={latestScan} compact />}
            />
            <ReaderActivityPanel
              scans={scanHistory}
              formatScanTime={formatScanTime}
              pulseActive={Boolean(scanPulseAt)}
              onClearHistory={clearScanHistory}
            />
            <EventLogPanel entries={eventLog} pulseActive={Boolean(scanPulseAt)} onExport={exportEventLog} />
          </section>

          <section id="firmware" className="dashboard-grid dashboard-grid--firmware">
            <SurfacePanel className="surface-panel--dense">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Firmware Center</p>
                  <h2>Guided update flow</h2>
                </div>
                <div className={`status-chip status-chip--${firmwareStatus?.tone || "default"}`}>
                  {firmwareStatus?.label || "Checking"}
                </div>
              </div>
              <div className="panel-inline-actions">
                <button className="panel-link" onClick={() => togglePanel("firmware")}>
                  {collapsedPanels.firmware ? "Expand" : "Collapse"}
                </button>
              </div>

              {!collapsedPanels.firmware ? (
                <>
                  <div className="firmware-grid">
                    <MiniStatCard icon={PackageCheck} label="nrfutil" value={updater?.nrfutil?.installed ? updater.nrfutil.version || "Installed" : "Not installed"} hint="Firmware flasher readiness" accent="violet" />
                    <MiniStatCard icon={HardDriveDownload} label="Chosen package" value={selectedFirmwareAsset?.name || "No package found"} hint={selectedRelease?.tag || "Select a release"} accent="cyan" />
                    <MiniStatCard icon={Cpu} label="Installed firmware" value={snapshot?.firmware || "--"} hint={`Published ${firmwarePublished}`} accent="mint" />
                  </div>

                  <div className="release-picker">
                    {releaseInfo?.releases?.slice(0, 6).map((release) => (
                      <button
                        key={release.id}
                        className={`release-chip ${selectedReleaseTag === release.tag ? "release-chip--active" : ""}`}
                        onClick={() => setSelectedReleaseTag(release.tag)}
                      >
                        {release.tag}
                        {release.isPrerelease ? " dev" : ""}
                      </button>
                    ))}
                  </div>

                  <p className="release-summary">{releaseSummary}</p>

                  <div className="firmware-actions">
                    <button
                      className="toolbar-button"
                      disabled={!selectedFirmwareAsset || Boolean(busyAction)}
                      onClick={() =>
                        runUpdaterAction(
                          "updater/download",
                          {
                            assetUrl: selectedFirmwareAsset.downloadUrl,
                            filename: selectedFirmwareAsset.name,
                          },
                          (payload) => {
                            setDownloadedFirmware(payload);
                            setToast(`Downloaded ${payload.filename}`);
                            window.setTimeout(() => setToast(""), 2500);
                          },
                        )
                      }
                    >
                      Download Package
                    </button>
                    <button
                      className="toolbar-button"
                      disabled={Boolean(busyAction)}
                      onClick={() =>
                        runUpdaterAction("updater/enter-dfu", {}, (payload) => {
                          setToast(payload.summary);
                          window.setTimeout(() => setToast(""), 3000);
                        })
                      }
                    >
                      Enter DFU
                    </button>
                    <button
                      className="toolbar-button toolbar-button--primary"
                      disabled={!downloadedFirmware || !updater?.nrfutil?.installed || Boolean(busyAction)}
                      onClick={() =>
                        runUpdaterAction("updater/install", { firmwarePath: downloadedFirmware.path }, (payload) => {
                          setInstallLog(payload.output || "Install completed.");
                          setToast("Firmware install command finished.");
                          window.setTimeout(() => setToast(""), 3000);
                        })
                      }
                    >
                      Install Firmware
                    </button>
                  </div>

                  {downloadedFirmware ? <p className="support-line">Downloaded: {downloadedFirmware.filename}</p> : null}
                  {installLog ? <pre className="log-block">{installLog}</pre> : null}
                </>
              ) : null}
            </SurfacePanel>
          </section>

          <section id="capabilities" className="dashboard-grid dashboard-grid--console">
            <SurfacePanel className="surface-panel--dense">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Manual Coverage</p>
                  <h2>Feature map from the Chameleon Ultra manual</h2>
                </div>
                <div className="status-chip status-chip--default">Derived from the published manual</div>
              </div>
              <div className="slot-toolbar capability-toolbar">
                <label className="search-field">
                  <Search size={14} />
                  <input
                    value={manualSearchQuery}
                    onChange={(event) => setManualSearchQuery(event.target.value)}
                    placeholder="Search manual features..."
                  />
                </label>
                <div className="filter-chips">
                  {manualCapabilityFilters.map((filter) => (
                    <button
                      key={filter.value}
                      className={`filter-chip ${manualFilter === filter.value ? "filter-chip--active" : ""}`}
                      onClick={() => setManualFilter(filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <button className="toolbar-button" onClick={() => togglePanel("capabilities")}>
                  {collapsedPanels.capabilities ? "Expand" : "Collapse"}
                </button>
              </div>

              {!collapsedPanels.capabilities ? (
                <div className="capability-groups">
                  {filteredCapabilityGroups.length ? (
                    filteredCapabilityGroups.map((group) => (
                      <div key={group.id} className="capability-group">
                        <div className="capability-group__header">
                          <h3>{group.title}</h3>
                          <span className="capability-group__count">{group.items.length} items</span>
                        </div>
                        <div className="capability-list">
                          {group.items.map((item) => (
                            <div key={item.name} className="capability-card">
                              <div className="capability-card__header">
                                <strong>{item.name}</strong>
                                <span className={`capability-status capability-status--${item.status}`}>{item.status}</span>
                              </div>
                              <p>{item.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No manual features match that filter yet.</div>
                  )}
                </div>
              ) : null}
            </SurfacePanel>
          </section>

          {consoleUnlocked ? (
            <section id="console" className="dashboard-grid dashboard-grid--console">
              <SurfacePanel className="surface-panel--dense">
                <div className="panel-heading">
                  <div>
                    <p className="panel-kicker">Console</p>
                    <h2>Operator console</h2>
                  </div>
                  <div className="status-chip status-chip--default">Unlocked with `</div>
                </div>
                <div className="panel-inline-actions">
                  <button className="panel-link" onClick={() => togglePanel("console")}>
                    {collapsedPanels.console ? "Expand" : "Collapse"}
                  </button>
                </div>
                {!collapsedPanels.console ? (
                  <>
                    <div className="console-grid">
                      <div className="console-card">
                        <h3>Connection</h3>
                        <p>{connectionLabel}</p>
                      </div>
                      <div className="console-card">
                        <h3>BLE</h3>
                        <p>{telemetry.bleConnectionStatus || "Not exposed"}</p>
                      </div>
                      <div className="console-card">
                        <h3>Signal indicators</h3>
                        <p>{telemetry.signalStrength ?? "Unavailable"}</p>
                      </div>
                      <div className="console-card">
                        <h3>Live sample</h3>
                        <p>{lastTelemetryLabel}</p>
                      </div>
                    </div>

                    <div className="console-shell">
                      <div className="console-shell__toolbar">
                        {["/help", "/status", "/detect", "/mode reader", "/mode emulator", "/slot list"].map((command) => (
                          <button
                            key={command}
                            className="filter-chip"
                            onClick={() => {
                              setConsoleInput(command);
                              executeConsoleCommand(command);
                            }}
                          >
                            {command}
                          </button>
                        ))}
                      </div>
                      <div className="console-terminal">
                        {consoleHistory.map((entry) => (
                          <div key={entry.id} className={`console-line console-line--${entry.kind}`}>
                            {entry.text}
                          </div>
                        ))}
                      </div>
                      <form
                        className="console-input-row"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const nextCommand = consoleInput;
                          setConsoleInput("");
                          executeConsoleCommand(nextCommand);
                        }}
                      >
                        <label className="console-prompt">/</label>
                        <input
                          value={consoleInput}
                          onChange={(event) => setConsoleInput(event.target.value)}
                          placeholder="/help, /status, /detect, /mode reader, /slot activate 2..."
                        />
                        <button className="toolbar-button toolbar-button--primary" type="submit" disabled={!consoleInput.trim() || Boolean(busyAction)}>
                          Run
                        </button>
                      </form>
                    </div>
                  </>
                ) : null}
              </SurfacePanel>
            </section>
          ) : null}
        </div>

        <FooterBar
          connectionLabel={connectionLabel}
          uptime={telemetry.uptimeSeconds ? `${telemetry.uptimeSeconds}s` : "Not exposed"}
          activeTime={footerTime}
        />
      </div>
    </div>
  );
}
