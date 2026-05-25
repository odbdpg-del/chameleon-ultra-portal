# Chameleon Ultra Portal

A local web dashboard for managing a Chameleon Ultra device with live status, telemetry, reader detection, slot inventory, firmware workflow, and a gated operator console for safe device operations.

## Overview

This project wraps the official Chameleon Ultra software in a more approachable browser-based control surface. It is designed for local use on the same machine as the device and focuses on device management, visibility, diagnostics, and workflow quality.

The portal currently includes:

- Live device snapshot and connection status
- Reader and emulator mode controls
- Slot explorer with naming, tags, archive state, and export
- Reader detection dashboard with scan history
- Telemetry panels for battery, voltage, and portal pulse
- Firmware center with release lookup and DFU workflow helpers
- Manual coverage map for available, partial, and planned features
- Hidden operator console unlocked with the backtick key

## Screens and Features

### Dashboard

- Hero overview for mode, battery, active slot, firmware, and connection
- Quick actions for common device tasks
- Live snapshot and RF visualization panels

### Slot Explorer

- Search and filter slots
- Inventory and grid views
- Rename, tag, color, archive, and export metadata

### Reader Tools

- HF and LF detection checks
- Scan history timeline
- Live scan intelligence panel

### Telemetry

- Battery trend
- Voltage trend
- Portal pulse activity
- Placeholder handling for firmware metrics that are not exposed yet

### Firmware

- Release lookup from the official Chameleon Ultra GitHub releases
- Download package workflow
- DFU handoff helpers
- Installer readiness and updater status

### Operator Console

- Hidden by default
- Unlocked with the backtick key
- Slash-style commands like `/help`, `/status`, `/detect`, and `/slot list`
- Focused on safe local device-management commands

## Project Structure

```text
chameleon-ultra-portal/
  bridge/   Python bridge into the official Chameleon Ultra scripts
  server/   Express API used by the portal
  src/      React frontend
```

## Requirements

- Windows
- Node.js
- A local checkout of the official [RfidResearchGroup/ChameleonUltra](https://github.com/RfidResearchGroup/ChameleonUltra) repository
- The official Chameleon Ultra Python environment created at:

```text
../ChameleonUltra/software/.venv/Scripts/python.exe
```

The portal expects the `ChameleonUltra` folder to sit next to this project in the same parent directory.

## Local Setup

1. Clone this repository.
2. Clone the official `ChameleonUltra` repository next to it.
3. Create the official Python virtual environment in `ChameleonUltra/software/.venv`.
4. Install portal dependencies:

```bash
npm install
```

5. Start the portal:

```bash
npm run dev
```

6. Open:

```text
http://127.0.0.1:4173
```

## Notes

- `downloads/` is local-only and not committed.
- `dist/` and `node_modules/` are ignored from version control.
- Firmware tooling availability depends on local `nrfutil` installation.
- Some telemetry fields are shown as unavailable when the device firmware does not expose them.

## Development

- Frontend: Vite + React
- Backend: Express
- Device bridge: Python wrapper around the official Chameleon Ultra software checkout

## License

MIT. See [LICENSE](./LICENSE).
