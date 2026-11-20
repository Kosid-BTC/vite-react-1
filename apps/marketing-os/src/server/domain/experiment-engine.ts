export interface ExperimentLineage {
  workspaceId: string;
  campaignId: string;
  experimentId: string;
}

export interface ExperimentVariantEvidence {
  variantId: string;
  exposures: number;
  outcomes: number;
}

export interface ExperimentEvaluationInput extends ExperimentLineage {
  primaryMetric: string;
  minimumExposuresPerVariant: number;
  variants: ExperimentVariantEvidence[];
}

export type ExperimentDecision = "COLLECT_MORE_EVIDENCE" | "NO_WINNER" | "PROPOSE_WINNER";

export interface ExperimentEvaluation extends ExperimentLineage {
  primaryMetric: string;
  decision: ExperimentDecision;
  proposedWinnerVariantId: string | null;
  humanReviewRequired: true;
  autoApply: false;
}

function assertCount(value: number, field: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a finite non-negative integer.`);
  }
}

export function evaluateExperiment(input: ExperimentEvaluationInput): ExperimentEvaluation {
  if (!input.primaryMetric.trim()) throw new Error("primaryMetric is required.");
  if (!Number.isInteger(input.minimumExposuresPerVariant) || input.minimumExposuresPerVariant <= 0) {
    throw new Error("minimumExposuresPerVariant must be a positive integer.");
  }
  if (input.variants.length < 2) throw new Error("At least two variants are required.");

  const ids = new Set<string>();
  for (const variant of input.variants) {
    if (!variant.variantId.trim()) throw new Error("variantId is required.");
    if (ids.has(variant.variantId)) throw new Error("Duplicate variantId.");
    ids.add(variant.variantId);
    assertCount(variant.exposures, "exposures");
    assertCount(variant.outcomes, "outcomes");
    if (variant.outcomes > variant.exposures) throw new Error("outcomes cannot exceed exposures.");
  }

  const base = {
    workspaceId: input.workspaceId,
    campaignId: input.campaignId,
    experimentId: input.experimentId,
    primaryMetric: input.primaryMetric,
    humanReviewRequired: true as const,
    autoApply: false as const,
  };

  if (input.variants.some((variant) => variant.exposures < input.minimumExposuresPerVariant)) {
    return { ...base, decision: "COLLECT_MORE_EVIDENCE", proposedWinnerVariantId: null };
  }

  const ranked = [...input.variants].sort((a, b) => {
    const left = a.outcomes * b.exposures;
    const right = b.outcomes * a.exposures;
    if (left !== right) return right - left;
    return a.variantId.localeCompare(b.variantId);
  });

  const first = ranked[0];
  const second = ranked[1];
  if (first.outcomes * second.exposures === second.outcomes * first.exposures) {
    return { ...base, decision: "NO_WINNER", proposedWinnerVariantId: null };
  }

  return { ...base, decision: "PROPOSE_WINNER", proposedWinnerVariantId: first.variantId };
}
