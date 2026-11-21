#!/usr/bin/env python3
"""Conservative fail-closed SQL scan. Never output source or secrets."""
import json, re, sys, hashlib
from pathlib import Path
src=Path(sys.argv[1]).read_bytes()
sql=src.decode("utf-8")
rules={
 "credential_or_jwt":r"(?i)(?:Bearer\s+\S+|eyJ[A-Za-z0-9_-]{20,}\.|(?:service_role|secret_key|api_key|password)\s*[:=]\s*['\x22][^'\x22]+)",
 "network_or_scheduler":r"(?i)\b(?:cron\.schedule|net\.http_\w+|http_(?:get|post)|dblink(?:_connect)?|postgres_fdw|CREATE\s+(?:SERVER|SUBSCRIPTION)|COPY\s+.*?PROGRAM)\b",
 "production_reference":r"(?i)(?:https?://|bjozpwdtqbpwcxnqguka)",
 "external_execution":r"(?i)\b(?:CREATE\s+EVENT\s+TRIGGER|ALTER\s+SYSTEM)\b",
}
hits={k:len(re.findall(v,sql)) for k,v in rules.items()}
report={"sha256":hashlib.sha256(src).hexdigest(),"bytes":len(src),"findings":hits,"passed":not any(hits.values())}
Path(sys.argv[2]).write_text(json.dumps(report,indent=2)+"\n")
print("SQL scanner:", "PASS (manual review required)" if report["passed"] else "BLOCKED", "categories:",",".join(k for k,v in hits.items() if v) or "none")
sys.exit(0 if report["passed"] else 2)
