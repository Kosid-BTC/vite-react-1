export interface AttributionTouchpoint {
  touchpointId: string;
  workspaceId: string;
  campaignId: string;
  contentItemId?: string | null;
  evidenceRef: string;
  channel: string;
  occurredAt: string;
}

export interface AttributionOutcome {
  outcomeId: string;
  workspaceId: string;
  campaignId: string;
  evidenceRef: string;
  occurredAt: string;
}

export interface AttributionInput {
  workspaceId: string;
  campaignId: string;
  touchpoints: AttributionTouchpoint[];
  outcomes: AttributionOutcome[];
}

export type AttributionDecision = "INSUFFICIENT_ATTRIBUTION_EVIDENCE" | "ATTRIBUTED";

export interface AttributionResult {
  workspaceId: string;
  campaignId: string;
  decision: AttributionDecision;
  attributedTouchpointId: string | null;
  attributedChannel: string | null;
  attributedContentItemId: string | null;
  sourceEvidenceRefs: string[];
  model: "LAST_TOUCH";
  causalClaim: false;
  humanReviewRequired: true;
  executable: false;
}

function parseInstant(value: string, field: string): number {
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error(`${field} must include an explicit timezone.`);
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO-8601 instant.`);
  return timestamp;
}

function assertScoped(input: AttributionInput): void {
  if (!input.workspaceId.trim()) throw new Error("workspaceId is required.");
  if (!input.campaignId.trim()) throw new Error("campaignId is required.");

  for (const touchpoint of input.touchpoints) {
    if (!touchpoint.touchpointId.trim()) throw new Error("touchpointId is required.");
    if (!touchpoint.evidenceRef.trim()) throw new Error("touchpoint evidenceRef is required.");
    if (!touchpoint.channel.trim()) throw new Error("channel is required.");
    if (touchpoint.workspaceId !== input.workspaceId || touchpoint.campaignId !== input.campaignId) {
      throw new Error("Touchpoint tenant/campaign scope mismatch.");
    }
    parseInstant(touchpoint.occurredAt, "touchpoint.occurredAt");
  }

  for (const outcome of input.outcomes) {
    if (!outcome.outcomeId.trim()) throw new Error("outcomeId is required.");
    if (!outcome.evidenceRef.trim()) throw new Error("outcome evidenceRef is required.");
    if (outcome.workspaceId !== input.workspaceId || outcome.campaignId !== input.campaignId) {
      throw new Error("Outcome tenant/campaign scope mismatch.");
    }
    parseInstant(outcome.occurredAt, "outcome.occurredAt");
  }
}

export function attributeLastTouch(input: AttributionInput): AttributionResult {
  assertScoped(input);

  const sourceEvidenceRefs = Array.from(new Set([
    ...input.touchpoints.map((item) => item.evidenceRef),
    ...input.outcomes.map((item) => item.evidenceRef),
  ])).sort((a, b) => a.localeCompare(b));

  const base = {
    workspaceId: input.workspaceId,
    campaignId: input.campaignId,
    sourceEvidenceRefs,
    model: "LAST_TOUCH" as const,
    causalClaim: false as const,
    humanReviewRequired: true as const,
    executable: false as const,
  };

  if (input.touchpoints.length === 0 || input.outcomes.length === 0) {
    return {
      ...base,
      decision: "INSUFFICIENT_ATTRIBUTION_EVIDENCE",
      attributedTouchpointId: null,
      attributedChannel: null,
      attributedContentItemId: null,
    };
  }

  const earliestOutcomeAt = Math.min(...input.outcomes.map((outcome) => parseInstant(outcome.occurredAt, "outcome.occurredAt")));
  const eligible = input.touchpoints.filter((touchpoint) => parseInstant(touchpoint.occurredAt, "touchpoint.occurredAt") <= earliestOutcomeAt);

  if (eligible.length === 0) {
    return {
      ...base,
      decision: "INSUFFICIENT_ATTRIBUTION_EVIDENCE",
      attributedTouchpointId: null,
      attributedChannel: null,
      attributedContentItemId: null,
    };
  }

  const ranked = [...eligible].sort((a, b) => {
    const timeDelta = parseInstant(b.occurredAt, "touchpoint.occurredAt") - parseInstant(a.occurredAt, "touchpoint.occurredAt");
    if (timeDelta !== 0) return timeDelta;
    return a.touchpointId.localeCompare(b.touchpointId);
  });

  const winner = ranked[0];
  return {
    ...base,
    decision: "ATTRIBUTED",
    attributedTouchpointId: winner.touchpointId,
    attributedChannel: winner.channel,
    attributedContentItemId: winner.contentItemId ?? null,
  };
}
