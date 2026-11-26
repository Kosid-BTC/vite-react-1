#!/usr/bin/env python3
"""Compare catalog TSV by object identity and hash; no SQL or secrets in output."""
import json,sys,hashlib
from pathlib import Path
def load(path):
    result={}
    for line in Path(path).read_text().splitlines():
        parts=line.split("\t",3)
        if len(parts)!=4: raise ValueError("Unexpected inventory row")
        kind,key,fingerprint,details=parts
        identity=(kind,key)
        if identity in result: raise ValueError("Duplicate object identity")
        result[identity]=(fingerprint,hashlib.sha256(details.encode()).hexdigest())
    return result
a,b=load(sys.argv[1]),load(sys.argv[2])
missing=sorted(set(a)-set(b))
extra=sorted(set(b)-set(a))
different=sorted(k for k in a.keys()&b.keys() if a[k]!=b[k])
summary={"production_count":len(a),"isolated_count":len(b),
         "missing":[{"kind":x[0],"object":x[1]} for x in missing],
         "extra":[{"kind":x[0],"object":x[1]} for x in extra],
         "mismatch":[{"kind":x[0],"object":x[1]} for x in different],
         "passed":not(missing or extra or different)}
Path(sys.argv[3]).write_text(json.dumps(summary,indent=2)+"\n")
print("PARITY:", "PASS (inventory scope only)" if summary["passed"] else "FAIL",
      "missing",len(missing),"extra",len(extra),"mismatch",len(different))
sys.exit(0 if summary["passed"] else 3)
