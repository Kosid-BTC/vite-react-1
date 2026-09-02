import assert from "node:assert/strict";
import { evaluateExperiment } from "../src/server/domain/experiment-engine";

function base() {
  return {
    workspaceId: "ws-1",
    campaignId: "campaign-1",
    experimentId: "experiment-1",
    primaryMetric: "activation",
    minimumExposuresPerVariant: 100,
  };
}

function main() {
  const insufficient = evaluateExperiment({ ...base(), variants: [
    { variantId: "a", exposures: 99, outcomes: 20 },
    { variantId: "b", exposures: 120, outcomes: 25 },
  ] });
  assert.equal(insufficient.decision, "COLLECT_MORE_EVIDENCE");
  assert.equal(insufficient.proposedWinnerVariantId, null);

  const tie = evaluateExperiment({ ...base(), variants: [
    { variantId: "a", exposures: 100, outcomes: 20 },
    { variantId: "b", exposures: 200, outcomes: 40 },
  ] });
  assert.equal(tie.decision, "NO_WINNER");

  const winner = evaluateExperiment({ ...base(), variants: [
    { variantId: "a", exposures: 100, outcomes: 30 },
    { variantId: "b", exposures: 100, outcomes: 20 },
  ] });
  assert.equal(winner.decision, "PROPOSE_WINNER");
  assert.equal(winner.proposedWinnerVariantId, "a");
  assert.equal(winner.humanReviewRequired, true);
  assert.equal(winner.autoApply, false);
  assert.deepEqual(winner, evaluateExperiment({ ...base(), variants: [
    { variantId: "a", exposures: 100, outcomes: 30 },
    { variantId: "b", exposures: 100, outcomes: 20 },
  ] }));

  assert.throws(() => evaluateExperiment({ ...base(), variants: [
    { variantId: "a", exposures: 100, outcomes: 101 },
    { variantId: "b", exposures: 100, outcomes: 20 },
  ] }));
  assert.throws(() => evaluateExperiment({ ...base(), variants: [
    { variantId: "a", exposures: 100, outcomes: 10 },
    { variantId: "a", exposures: 100, outcomes: 20 },
  ] }));

  console.log("P3_1_EXPERIMENT_ENGINE_FOUNDATION: PASS");
}

main();
