#!/usr/bin/env python3
"""Fail-closed scanner for untrusted schema-only SQL. Never prints source SQL."""
import json, re, sys, hashlib
from pathlib import Path
p=Path(sys.argv[1]); data=p.read_bytes(); sql=data.decode("utf-8")
patterns={
 "credential_or_jwt":r"(?i)(?:Bearer\s+\S+|eyJ[A-Za-z0-9_-]{20,}\.|(?:service_role|secret_key|api_key|password)\s*[:=]\s*['\"][^'\"]+)",
 "network_or_scheduler":r"(?i)\b(?:cron\.schedule|net\.http_\w+|http_(?:get|post)|dblink(?:_connect)?|postgres_fdw|CREATE\s+(?:SERVER|SUBSCRIPTION)|COPY\s+.*?PROGRAM)\b",
 "production_reference":r"(?i)(?:https?://|bjozpwdtqbpwcxnqguka)",
 "external_execution":r"(?i)\b(?:CREATE\s+EVENT\s+TRIGGER|ALTER\s+SYSTEM|CREATE\s+EXTENSION\s+.*?\b(?:http|postgres_fdw|dblink)\b)\b",
}
hits={k:len(re.findall(v,sql)) for k,v in patterns.items()}
# A regex scanner is not a proof of safety. Manual attestation is required even on zero matches.
result={"sha256":hashlib.sha256(data).hexdigest(),"bytes":len(data),"findings":hits,"passed":not any(hits.values())}
Path(sys.argv[2]).write_text(json.dumps(result,indent=2)+"\n")
print("SQL scanner:", "PASS (manual review still required)" if result["passed"] else "BLOCKED", "; categories:",",".join(k for k,v in hits.items() if v) or "none")
sys.exit(0 if result["passed"] else 2)
