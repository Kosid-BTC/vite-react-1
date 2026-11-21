#!/usr/bin/env python3
"""Fail-closed byte normalization check for recovered audit SQL (not a SQL parser).

Compare the original audited files to current files. Only CRLF->LF, trailing
horizontal whitespace and terminal blank-line removal are permitted. Because
SQL literals and dollar-quoted bodies may be sensitive to whitespace, a PASS
here is NOT SQL semantic equivalence and does not authorize replay.
"""
import subprocess
import sys
from pathlib import Path

BASE = "2847a15bd3400aca39c82979571950fc10f3115e"
PREFIX = "apps/marketing-os/security/recovered-sql/"
def git(*args):
    return subprocess.check_output(["git", *args], stderr=subprocess.DEVNULL)

def normalize(blob):
    return blob.replace(b"\r\n", b"\n").split(b"\x00")[0] if b"\x00" in blob else normalize_lines(blob)

def normalize_lines(blob):
    return b"\n".join(line.rstrip(b" \t") for line in blob.replace(b"\r\n", b"\n").split(b"\n")).rstrip(b"\n") + b"\n"

def main():
    names = git("diff", "--name-only", BASE, "HEAD", "--", PREFIX).decode().splitlines()
    if not names:
        raise ValueError("No recovered SQL changes found")
    for name in names:
        if not name.startswith(PREFIX) or not name.endswith(".sql"):
            raise ValueError("Unexpected audit SQL path")
        original = git("show", f"{BASE}:{name}")
        current = Path(name).read_bytes()
        if b"\x00" in original or b"\x00" in current or normalize_lines(original) != current:
            raise ValueError(f"Non-whitespace change or unexpected file content: {name}")
    print(f"PASS: {len(names)} recovered SQL files match the allowed byte normalization")
    print("NOTE: NOT SQL semantic equivalence; function literals still require review")

if __name__ == "__main__":
    try:
        main()
    except (ValueError, subprocess.CalledProcessError, OSError) as exc:
        print(f"FAIL CLOSED: {exc}", file=sys.stderr)
        sys.exit(1)
