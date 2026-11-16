#!/usr/bin/env python3
"""Build the extension ZIP and check that release assets match their source."""

import argparse
import hashlib
import io
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXTENSION_FILES = (
    "manifest.json",
    "background.js",
    "scheduler.js",
    "settings.js",
    "popup.html",
    "popup.css",
    "popup.js",
)
ARCHIVES = ("cookie-remover.zip", "cookie-cleaner-10min.zip")


def make_archive():
    manifest = json.loads((ROOT / "manifest.json").read_text())
    if manifest["background"]["service_worker"] not in EXTENSION_FILES:
        raise SystemExit("The background worker is missing from the package.")
    if manifest["action"]["default_popup"] not in EXTENSION_FILES:
        raise SystemExit("The popup is missing from the package.")

    data = io.BytesIO()
    with zipfile.ZipFile(data, "w") as archive:
        for name in EXTENSION_FILES:
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(
                info, (ROOT / name).read_bytes(),
                compress_type=zipfile.ZIP_DEFLATED, compresslevel=9
            )
    return data.getvalue()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--verify-tag")
    args = parser.parse_args()
    payload = make_archive()

    if args.verify_tag:
        for name in EXTENSION_FILES:
            tagged = subprocess.check_output(
                ["git", "show", f"{args.verify_tag}:{name}"], cwd=ROOT
            )
            if tagged != (ROOT / name).read_bytes():
                raise SystemExit(f"{name} differs from {args.verify_tag}.")

    for name in ARCHIVES:
        path = ROOT / name
        if args.check:
            if not path.is_file() or path.read_bytes() != payload:
                raise SystemExit(f"{name} is out of date. Run npm run package.")
        else:
            path.write_bytes(payload)

    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        if archive.testzip() is not None:
            raise SystemExit("ZIP integrity check failed.")
        if archive.namelist() != list(EXTENSION_FILES):
            raise SystemExit("Unexpected archive layout.")

    print(f"Verified {len(EXTENSION_FILES)} extension files at the ZIP root.")
    print(f"SHA-256: {hashlib.sha256(payload).hexdigest()}")


if __name__ == "__main__":
    main()
