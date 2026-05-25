#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timezone


ROOT = Path(__file__).resolve().parent.parent
CHAMELEON_SCRIPT_DIR = ROOT.parent / "ChameleonUltra" / "software" / "script"
if not CHAMELEON_SCRIPT_DIR.exists():
    raise SystemExit("Official ChameleonUltra software directory was not found next to the portal.")

sys.path.insert(0, str(CHAMELEON_SCRIPT_DIR))

import serial.tools.list_ports  # type: ignore

import chameleon_cmd  # type: ignore
import chameleon_com  # type: ignore
from chameleon_enum import (  # type: ignore
    MifareClassicPrngType,
    MifareClassicWriteMode,
    SlotNumber,
    TagSenseType,
    TagSpecificType,
)


HF_MIFARE_TYPES = {
    TagSpecificType.MIFARE_Mini,
    TagSpecificType.MIFARE_1024,
    TagSpecificType.MIFARE_2048,
    TagSpecificType.MIFARE_4096,
}

MODEL_NAMES = ["Chameleon Ultra", "Chameleon Lite"]


def windows_autodetect_port():
    powershell = "powershell.exe"
    query = (
        "Get-PnPDevice -Class Ports -PresentOnly | "
        "where {$_.DeviceID -like '*VID_6868&PID_8686*'} | "
        "Select-Object -First 1 FriendlyName | "
        "% FriendlyName | "
        "select-string COM\\d+ | "
        "% { $_.matches.value }"
    )
    result = subprocess.run(
        [powershell, query],
        capture_output=True,
        text=True,
        check=False,
    )
    port = result.stdout.strip()
    return port or None


def autodetect_port():
    if os.name == "nt":
        port = windows_autodetect_port()
        if port:
            return port

    for port in serial.tools.list_ports.comports():
        if port.vid == 0x6868:
            return port.device
    return None


def enum_name(enum_cls, value):
    try:
        return enum_cls(value).name
    except Exception:
        return f"UNKNOWN_{value}"


def connect():
    port = autodetect_port()
    if not port:
        raise RuntimeError("Chameleon Ultra not found over USB. Plug it in and try refresh.")

    device = chameleon_com.ChameleonCom().open(port)
    cmd = chameleon_cmd.ChameleonCMD(device)
    return port, device, cmd


def safe_call(func, default=None):
    try:
        return func()
    except Exception:
        return default


def get_model_name(cmd):
    model_index = safe_call(cmd.get_device_model, 0)
    if isinstance(model_index, int) and 0 <= model_index < len(MODEL_NAMES):
        return MODEL_NAMES[model_index]
    return "Chameleon Device"


def get_all_slot_nicks_safe(cmd):
    all_nicks = safe_call(cmd.get_all_slot_nicks)
    if all_nicks:
        return all_nicks

    fallback = []
    for index in SlotNumber:
        fallback.append(
            {
                "hf": safe_call(lambda idx=index: cmd.get_slot_tag_nick(idx, 2), "") or "",
                "lf": safe_call(lambda idx=index: cmd.get_slot_tag_nick(idx, 1), "") or "",
            }
        )
    return fallback


def slot_snapshot(cmd):
    slot_info = cmd.get_slot_info()
    enabled = cmd.get_enabled_slots()
    active_slot = SlotNumber.from_fw(cmd.get_active_slot())
    all_nicks = get_all_slot_nicks_safe(cmd)

    snapshots = []
    original_slot = active_slot

    for index in SlotNumber:
        fw_index = SlotNumber.to_fw(index)
        hf_value = slot_info[fw_index]["hf"]
        lf_value = slot_info[fw_index]["lf"]
        hf_type = enum_name(TagSpecificType, hf_value)
        lf_type = enum_name(TagSpecificType, lf_value)
        hf_nick = all_nicks[fw_index]["hf"]
        lf_nick = all_nicks[fw_index]["lf"]

        current = {
            "slot": int(index),
            "nick": hf_nick or lf_nick or "",
            "hf": {
                "type": hf_type,
                "enabled": bool(enabled[fw_index]["hf"]),
            },
            "lf": {
                "type": lf_type,
                "enabled": bool(enabled[fw_index]["lf"]),
            },
        }

        cmd.set_active_slot(index)

        if current["hf"]["enabled"] and hf_value != TagSpecificType.UNDEFINED:
            try:
                anti = cmd.hf14a_get_anti_coll_data()
                current["hf"]["uid"] = anti["uid"].hex().upper()
                current["hf"]["atqa"] = anti["atqa"].hex().upper()
                current["hf"]["sak"] = anti["sak"].hex().upper()
                current["hf"]["ats"] = anti["ats"].hex().upper() if anti["ats"] else ""
            except Exception:
                pass

        if hf_value in HF_MIFARE_TYPES:
            try:
                prng_type = cmd.mf1_get_prng_type()
                current["hf"]["prngType"] = enum_name(MifareClassicPrngType, prng_type)
            except Exception:
                pass

            try:
                emulator_config = cmd.mf1_get_emulator_config()
                current["hf"]["writeMode"] = enum_name(
                    MifareClassicWriteMode,
                    emulator_config["write_mode"],
                )
            except Exception:
                pass

        snapshots.append(current)

    cmd.set_active_slot(original_slot)
    return snapshots


def build_snapshot():
    port, device, cmd = connect()
    try:
        major, minor = cmd.get_app_version()
        voltage_mv, battery_percent = cmd.get_battery_info()
        device_settings = safe_call(cmd.get_device_settings, {})
        if not isinstance(device_settings, dict):
            device_settings = {}
        snapshot = {
            "port": port,
            "model": get_model_name(cmd),
            "firmware": f"v{major}.{minor}",
            "mode": "Reader" if cmd.is_device_reader_mode() else "Emulator",
            "activeSlot": int(SlotNumber.from_fw(cmd.get_active_slot())),
            "battery": {
                "millivolts": voltage_mv,
                "voltage": f"{voltage_mv / 1000:.2f}",
                "percent": battery_percent,
            },
            "telemetry": {
                "usbConnected": True,
                "blePairingEnabled": bool(device_settings.get("ble_pairing_enable")) if "ble_pairing_enable" in device_settings else None,
                "bleConnectionStatus": None,
                "signalStrength": None,
                "uptimeSeconds": None,
                "temperatureC": None,
                "health": {
                    "sleepTimeoutSeconds": device_settings.get("sleep_timeout"),
                    "settingsVersion": device_settings.get("settings_version"),
                },
            },
            "slots": slot_snapshot(cmd),
        }
        return snapshot
    finally:
        device.close()


def detect_tag():
    port, device, cmd = connect()
    try:
        if not cmd.is_device_reader_mode():
            raise RuntimeError("Switch the device to reader mode before scanning for a badge.")

        scanned_at = datetime.now(timezone.utc).isoformat()

        try:
            hf_tags = cmd.hf14a_scan()
            if hf_tags:
                first_tag = hf_tags[0]
                uid_bytes = first_tag.get("uid") or b""
                return {
                    "detected": True,
                    "family": "HF 14A",
                    "technology": "ISO14443A",
                    "protocolFamily": "High Frequency",
                    "frequency": "13.56 MHz",
                    "uidPresent": bool(uid_bytes),
                    "scanTimestamp": scanned_at,
                    "summary": f"Detected {len(hf_tags)} HF 14A tag(s).",
                    "details": {
                        "count": len(hf_tags),
                        "uidLength": len(uid_bytes) if uid_bytes else None,
                    },
                }
        except Exception:
            pass

        lf_scans = [
            ("EM410X", cmd.em410x_scan),
            ("HID Prox", lambda: cmd.hidprox_scan(0)),
            ("ioProx", cmd.ioprox_scan),
            ("Viking", cmd.viking_scan),
            ("PAC/Stanley", cmd.pac_scan),
            ("EM4x05", cmd.em4x05_scan),
        ]

        for family, scan_fn in lf_scans:
            try:
                result = scan_fn()
                if result is not None:
                    return {
                        "detected": True,
                        "family": family,
                        "technology": family,
                        "protocolFamily": "Low Frequency",
                        "frequency": "125 kHz",
                        "uidPresent": True,
                        "scanTimestamp": scanned_at,
                        "summary": f"Detected an {family} low-frequency tag.",
                        "details": {},
                    }
            except Exception:
                continue

        return {
            "detected": False,
            "family": None,
            "technology": None,
            "protocolFamily": None,
            "frequency": None,
            "uidPresent": False,
            "scanTimestamp": scanned_at,
            "summary": "No supported HF or LF tag was detected in this scan.",
            "details": {},
        }
    finally:
        device.close()


def enter_dfu():
    port, device, cmd = connect()
    try:
        cmd.enter_bootloader()
        return {
            "ok": True,
            "summary": "Device told to reboot into DFU mode. LEDs 4 and 5 should begin alternating while it waits for firmware.",
        }
    finally:
        try:
            device.close()
        except Exception:
            pass


def rename_slot(slot, nickname):
    slot_number = SlotNumber(int(slot))
    name = str(nickname or "").strip()
    port, device, cmd = connect()
    try:
        slot_info = cmd.get_slot_info()
        enabled = cmd.get_enabled_slots()
        fw_index = SlotNumber.to_fw(slot_number)
        hf_value = slot_info[fw_index]["hf"]
        lf_value = slot_info[fw_index]["lf"]

        wrote_any = False

        if enabled[fw_index]["hf"] and hf_value != TagSpecificType.UNDEFINED:
            if name:
                cmd.set_slot_tag_nick(slot_number, TagSenseType.HF, name)
            else:
                cmd.delete_slot_tag_nick(slot_number, TagSenseType.HF)
            wrote_any = True

        if enabled[fw_index]["lf"] and lf_value != TagSpecificType.UNDEFINED:
            if name:
                cmd.set_slot_tag_nick(slot_number, TagSenseType.LF, name)
            else:
                cmd.delete_slot_tag_nick(slot_number, TagSenseType.LF)
            wrote_any = True

        if wrote_any:
            cmd.slot_data_config_save()

        return build_snapshot()
    finally:
        try:
            device.close()
        except Exception:
            pass


def set_mode(mode):
    if mode not in {"reader", "emulator"}:
        raise ValueError("Mode must be 'reader' or 'emulator'.")

    port, device, cmd = connect()
    try:
        cmd.set_device_reader_mode(mode == "reader")
    finally:
        device.close()
    return build_snapshot()


def set_active_slot(slot):
    slot_number = int(slot)
    port, device, cmd = connect()
    try:
        cmd.set_active_slot(SlotNumber(slot_number))
    finally:
        device.close()
    return build_snapshot()


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "snapshot"
    payload = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}

    if command == "snapshot":
        result = build_snapshot()
    elif command == "detect-tag":
        result = detect_tag()
    elif command == "enter-dfu":
        result = enter_dfu()
    elif command == "rename-slot":
        result = rename_slot(payload.get("slot"), payload.get("nickname"))
    elif command == "set-mode":
        result = set_mode(payload.get("mode"))
    elif command == "set-active-slot":
        result = set_active_slot(payload.get("slot"))
    else:
        raise ValueError(f"Unsupported command: {command}")

    sys.stdout.write(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        sys.stderr.write(str(exc))
        sys.exit(1)
