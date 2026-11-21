#!/usr/bin/env python3
"""Offline self-tests for fail-closed SQL scan and catalog comparator.

No database, Production connection, Docker or credentials required.
Run: python3 apps/marketing-os/security/test_parity_guards.py
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCAN = ROOT / "scan_schema_sql.py"
COMPARE = ROOT / "compare_parity.py"

def run(script, inputs, expected_code):
    with tempfile.TemporaryDirectory() as directory:
        d = Path(directory)
        paths = []
        for i, value in enumerate(inputs):
            path = d / f"input-{i}.txt"
            path.write_text(value, encoding="utf-8")
            paths.append(str(path))
        report = d / "report.json"
        result = subprocess.run([sys.executable, str(script), *paths, str(report)],
                                text=True, capture_output=True, timeout=15)
        assert result.returncode == expected_code, (
            f"{script.name}: expected {expected_code}, got {result.returncode}; "
            f"stdout={result.stdout!r}; stderr={result.stderr!r}"
        )
        parsed = json.loads(report.read_text(encoding="utf-8"))
        assert parsed["passed"] == (expected_code == 0), parsed
        return parsed

def main():
    run(SCAN, ["CREATE TABLE public.audit_fixture (id integer);\n"], 0)
    for unsafe in [
        "SELECT cron.schedule('x', '* * * * *', 'SELECT 1');",
        "SELECT net.http_post(url := 'https://example.invalid');",
        "SELECT 'Bearer example_credential';",
        "CREATE SERVER remote FOREIGN DATA WRAPPER postgres_fdw;",
        "COPY public.audit_fixture FROM PROGRAM 'false';",
        "ALTER SYSTEM SET log_statement = 'all';",
    ]:
        run(SCAN, [unsafe], 2)
    baseline = 'table\tpublic.audit_fixture\tabc\t{"rls":true}\n'
    run(COMPARE, [baseline, baseline], 0)
    for other in [
        "",
        'table\tpublic.audit_fixture\tdef\t{"rls":true}\n',
        'table\tpublic.audit_fixture\tabc\t{"rls":false}\n',
        baseline + 'table\tpublic.extra\txyz\t{}\n',
    ]:
        run(COMPARE, [baseline, other], 3)
    print("PASS: offline SQL-scan and inventory-diff fail-closed guard tests")

if __name__ == "__main__":
    main()
