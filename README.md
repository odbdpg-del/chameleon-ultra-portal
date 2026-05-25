# Chameleon Ultra Portal

A local web portal for managing a Chameleon Ultra device with a dashboard-style interface for status, telemetry, reader detection, slot inventory, firmware workflow, and a gated operator console for safe device operations.

## What It Includes

- Dashboard with live device snapshot and telemetry
- Reader detection history and scan intelligence
- Slot explorer with rename, tags, archive state, and export
- Firmware center with release lookup and DFU workflow helpers
- Manual coverage map for supported and planned portal features
- Hidden operator console unlocked with the backtick key

## Requirements

- Windows with Node.js installed
- A local checkout of the official `RfidResearchGroup/ChameleonUltra` repository
- The official Chameleon Ultra Python environment created at:

```text
../ChameleonUltra/software/.venv/Scripts/python.exe
```

The portal expects the `ChameleonUltra` folder to sit next to this project in the same parent directory.

## Project Layout

```text
chameleon-ultra-portal/
  bridge/   Python bridge into the official Chameleon Ultra scripts
  server/   Express API for the portal
  src/      React frontend
```

## Setup

1. Clone the official Chameleon Ultra repository next to this project.
2. Create the official Python virtual environment in `ChameleonUltra/software/.venv`.
3. Install portal dependencies:

```bash
npm install
```

4. Start the portal:

```bash
npm run dev
```

5. Open:

```text
http://127.0.0.1:4173
```

## Notes

- The `downloads/` folder is local-only and is not committed.
- The portal is designed around device management, telemetry, diagnostics, and safe operator workflows.
- Firmware tooling availability depends on local `nrfutil` installation.

## Development

- Frontend: Vite + React
- Backend: Express
- Device bridge: Python script that reuses the official Chameleon Ultra software checkout
