import assert from "node:assert/strict";
import {
  evaluateMeasurementHealth,
  type FunnelObservation,
} from "../src/server/domain/analytics-foundation";

const completeObservations: FunnelObservation[] = [
  { stage: "EXPOSURE", eventId: "page_view", observedCount: 40 },
  { stage: "ATTENTION", eventId: "engaged_view", observedCount: 25 },
  { stage: "INTENT", eventId: "cta_click", observedCount: 15 },
  { stage: "ACTIVATION", eventId: "signup", observedCount: 8 },
  { stage: "REVENUE", eventId: "purchase", observedCount: 3 },
  { stage: "RETENTION", eventId: "repeat_use", observedCount: 1 },
];

function run(): void {
  const lineage = {
    workspaceId: "ws-a",
    campaignId: "campaign-a",
    contentItemId: "content-a",
  };

  const limited = evaluateMeasurementHealth({
    ...lineage,
    observations: completeObservations,
    maturityThreshold: 100,
  });

  assert.equal(limited.workspaceId, lineage.workspaceId);
  assert.equal(limited.campaignId, lineage.campaignId);
  assert.equal(limited.contentItemId, lineage.contentItemId);
  assert.equal(limited.status, "LIMITED");
  assert.equal(limited.countsOnly, true);
  assert.equal(limited.rateMetricsEligible, false);
  assert.equal(limited.economicMetricsEligible, false);
  assert.deepEqual(limited.observations, completeObservations);
  assert.equal(limited.totalObservedCount, 92);

  const healthy = evaluateMeasurementHealth({
    ...lineage,
    observations: completeObservations,
    maturityThreshold: 90,
  });

  assert.equal(healthy.status, "HEALTHY");
  assert.equal(healthy.countsOnly, false);
  assert.equal(healthy.rateMetricsEligible, true);
  assert.equal(healthy.economicMetricsEligible, false);

  const unhealthy = evaluateMeasurementHealth({
    ...lineage,
    observations: completeObservations.map((observation) =>
      observation.stage === "INTENT" ? { ...observation, eventId: "  " } : observation,
    ),
    maturityThreshold: 90,
  });

  assert.equal(unhealthy.status, "UNHEALTHY");
  assert.equal(unhealthy.countsOnly, true);
  assert.equal(unhealthy.rateMetricsEligible, false);
  assert.deepEqual(unhealthy.missingEventStages, ["INTENT"]);

  const repeated = evaluateMeasurementHealth({
    ...lineage,
    observations: completeObservations,
    maturityThreshold: 90,
  });
  assert.deepEqual(repeated, healthy);

  assert.throws(
    () =>
      evaluateMeasurementHealth({
        ...lineage,
        observations: [...completeObservations, completeObservations[0]],
        maturityThreshold: 90,
      }),
    /Duplicate observation/,
  );

  assert.throws(
    () =>
      evaluateMeasurementHealth({
        ...lineage,
        observations: completeObservations.map((observation) =>
          observation.stage === "REVENUE" ? { ...observation, observedCount: -1 } : observation,
        ),
        maturityThreshold: 90,
      }),
    /non-negative integer/,
  );

  console.log("P3_0_ANALYTICS_FOUNDATION: PASS");
}

run();
