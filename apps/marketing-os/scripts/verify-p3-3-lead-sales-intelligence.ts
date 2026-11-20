import assert from "node:assert/strict";
import { assessLeadSalesEvidence } from "../src/server/domain/lead-sales-intelligence";

const base = { workspaceId: "ws-a", leadId: "lead-1" };
const insufficient = assessLeadSalesEvidence({ ...base, evidence: [] });
assert.equal(insufficient.maturity, "INSUFFICIENT");
assert.equal(insufficient.stage, "UNKNOWN");
assert.equal(insufficient.score, null);
assert.equal(insufficient.humanReviewRequired, true);
assert.equal(insufficient.executable, false);
assert.equal(insufficient.causalClaim, false);

const observed = assessLeadSalesEvidence({
  ...base,
  evidence: [
    { ...base, observedAt: "2026-09-02T00:00:00Z", source: "FORM", kind: "IDENTIFIED", evidenceRef: "form:1" },
    { ...base, observedAt: "2026-09-02T01:00:00Z", source: "CRM", kind: "QUALIFIED", evidenceRef: "crm:2" },
  ],
});
assert.equal(observed.maturity, "CORROBORATED");
assert.equal(observed.stage, "QUALIFIED");
assert.deepEqual(observed.evidenceRefs, ["form:1", "crm:2"]);
assert.equal(observed.scoreReason, "SCORING_NOT_AUTHORIZED");
assert.equal(observed.executable, false);

assert.throws(
  () => assessLeadSalesEvidence({
    ...base,
    evidence: [{ workspaceId: "ws-b", leadId: "lead-1", observedAt: "2026-09-02T00:00:00Z", source: "CRM", kind: "ENGAGED", evidenceRef: "crm:x" }],
  }),
  /LEAD_SALES_SCOPE_MISMATCH/,
);

console.log("P3.3 Lead/Sales Intelligence verification PASS");
