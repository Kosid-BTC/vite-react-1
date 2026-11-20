import assert from "node:assert/strict";
import { assessLeadSalesEvidence } from "../src/server/domain/lead-sales-intelligence";
import { recommendNextBestAction } from "../src/server/domain/next-best-action";

const base = { workspaceId: "ws-a", leadId: "lead-1" };

const insufficientAssessment = assessLeadSalesEvidence({ ...base, evidence: [] });
const insufficient = recommendNextBestAction({ ...base, assessment: insufficientAssessment });
assert.equal(insufficient.action, "COLLECT_EVIDENCE");
assert.equal(insufficient.evidenceMaturity, "INSUFFICIENT");
assert.equal(insufficient.score, null);
assert.equal(insufficient.causalClaim, false);
assert.equal(insufficient.humanReviewRequired, true);
assert.equal(insufficient.humanApprovalRequired, true);
assert.equal(insufficient.executable, false);

const qualifiedAssessment = assessLeadSalesEvidence({
  ...base,
  evidence: [
    { ...base, observedAt: "2026-09-02T00:00:00Z", source: "FORM", kind: "IDENTIFIED", evidenceRef: "form:1" },
    { ...base, observedAt: "2026-09-02T01:00:00Z", source: "CRM", kind: "QUALIFIED", evidenceRef: "crm:2" },
  ],
});
const qualified = recommendNextBestAction({ ...base, assessment: qualifiedAssessment });
assert.equal(qualified.action, "PREPARE_DISCOVERY");
assert.equal(qualified.evidenceMaturity, "CORROBORATED");
assert.deepEqual(qualified.evidenceRefs, ["form:1", "crm:2"]);
assert.equal(qualified.scoreReason, "SCORING_NOT_AUTHORIZED");
assert.equal(qualified.executable, false);

assert.throws(
  () => recommendNextBestAction({ workspaceId: "ws-b", leadId: "lead-1", assessment: qualifiedAssessment }),
  /NEXT_BEST_ACTION_SCOPE_MISMATCH/,
);

assert.throws(
  () => recommendNextBestAction({
    ...base,
    assessment: { ...qualifiedAssessment, executable: true as false },
  }),
  /NEXT_BEST_ACTION_UNTRUSTED_ASSESSMENT/,
);

console.log("P3.4 Next Best Action verification PASS");
