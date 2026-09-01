export type FunnelStage =
  | "EXPOSURE"
  | "ATTENTION"
  | "INTENT"
  | "ACTIVATION"
  | "REVENUE"
  | "RETENTION";

export interface AnalyticsLineage {
  workspaceId: string;
  campaignId?: string;
  contentItemId?: string;
}

export interface FunnelObservation {
  stage: FunnelStage;
  eventId: string;
  observedCount: number;
}

export interface AnalyticsInput extends AnalyticsLineage {
  observations: FunnelObservation[];
  maturityThreshold: number;
}

export type MeasurementHealthStatus = "UNHEALTHY" | "LIMITED" | "HEALTHY";

export interface MeasurementHealthResult extends AnalyticsLineage {
  status: MeasurementHealthStatus;
  missingEventStages: FunnelStage[];
  totalObservedCount: number;
  countsOnly: boolean;
  rateMetricsEligible: boolean;
  economicMetricsEligible: false;
  observations: FunnelObservation[];
}

const FUNNEL_STAGES: FunnelStage[] = [
  "EXPOSURE",
  "ATTENTION",
  "INTENT",
  "ACTIVATION",
  "REVENUE",
  "RETENTION",
];

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
}

function normalizeObservation(observation: FunnelObservation): FunnelObservation {
  const eventId = observation.eventId.trim();
  if (!eventId) {
    return { ...observation, eventId: "" };
  }
  assertNonNegativeInteger(observation.observedCount, "observedCount");
  return { ...observation, eventId };
}

export function evaluateMeasurementHealth(input: AnalyticsInput): MeasurementHealthResult {
  assertNonNegativeInteger(input.maturityThreshold, "maturityThreshold");

  const observations = input.observations.map(normalizeObservation);
  const byStage = new Map<FunnelStage, FunnelObservation>();

  for (const observation of observations) {
    if (byStage.has(observation.stage)) {
      throw new Error(`Duplicate observation for funnel stage ${observation.stage}.`);
    }
    byStage.set(observation.stage, observation);
  }

  const missingEventStages = FUNNEL_STAGES.filter((stage) => {
    const observation = byStage.get(stage);
    return !observation || observation.eventId.length === 0;
  });

  const totalObservedCount = observations.reduce(
    (sum, observation) => sum + observation.observedCount,
    0,
  );

  if (missingEventStages.length > 0) {
    return {
      workspaceId: input.workspaceId,
      campaignId: input.campaignId,
      contentItemId: input.contentItemId,
      status: "UNHEALTHY",
      missingEventStages,
      totalObservedCount,
      countsOnly: true,
      rateMetricsEligible: false,
      economicMetricsEligible: false,
      observations,
    };
  }

  const mature = totalObservedCount >= input.maturityThreshold;

  return {
    workspaceId: input.workspaceId,
    campaignId: input.campaignId,
    contentItemId: input.contentItemId,
    status: mature ? "HEALTHY" : "LIMITED",
    missingEventStages: [],
    totalObservedCount,
    countsOnly: !mature,
    rateMetricsEligible: mature,
    economicMetricsEligible: false,
    observations,
  };
}
