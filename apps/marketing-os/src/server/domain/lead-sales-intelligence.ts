export type EvidenceMaturity = "OBSERVED" | "CORROBORATED" | "INSUFFICIENT";

export type LeadEvidence = {
  workspaceId: string;
  leadId: string;
  observedAt: string;
  source: "FORM" | "CRM" | "SALES_EVENT" | "FIRST_PARTY_ANALYTICS";
  kind: "IDENTIFIED" | "ENGAGED" | "QUALIFIED" | "OPPORTUNITY" | "WON" | "LOST";
  evidenceRef: string;
};

export type LeadSalesAssessment = {
  workspaceId: string;
  leadId: string;
  maturity: EvidenceMaturity;
  observedSignals: LeadEvidence["kind"][];
  evidenceRefs: string[];
  stage: "UNKNOWN" | "LEAD" | "ENGAGED" | "QUALIFIED" | "OPPORTUNITY" | "CUSTOMER" | "LOST";
  score: null;
  scoreReason: "SCORING_NOT_AUTHORIZED";
  causalClaim: false;
  humanReviewRequired: true;
  executable: false;
};

const stageRank: Record<LeadEvidence["kind"], number> = {
  IDENTIFIED: 1,
  ENGAGED: 2,
  QUALIFIED: 3,
  OPPORTUNITY: 4,
  WON: 5,
  LOST: 6,
};

function stageFrom(kind: LeadEvidence["kind"]): LeadSalesAssessment["stage"] {
  if (kind === "IDENTIFIED") return "LEAD";
  if (kind === "ENGAGED") return "ENGAGED";
  if (kind === "QUALIFIED") return "QUALIFIED";
  if (kind === "OPPORTUNITY") return "OPPORTUNITY";
  if (kind === "WON") return "CUSTOMER";
  return "LOST";
}

export function assessLeadSalesEvidence(input: {
  workspaceId: string;
  leadId: string;
  evidence: LeadEvidence[];
}): LeadSalesAssessment {
  const scoped = input.evidence.filter(
    (item) => item.workspaceId === input.workspaceId && item.leadId === input.leadId,
  );
  if (scoped.length !== input.evidence.length) {
    throw new Error("LEAD_SALES_SCOPE_MISMATCH");
  }
  if (scoped.length === 0) {
    return {
      workspaceId: input.workspaceId,
      leadId: input.leadId,
      maturity: "INSUFFICIENT",
      observedSignals: [],
      evidenceRefs: [],
      stage: "UNKNOWN",
      score: null,
      scoreReason: "SCORING_NOT_AUTHORIZED",
      causalClaim: false,
      humanReviewRequired: true,
      executable: false,
    };
  }

  const ordered = [...scoped].sort((a, b) => {
    const byTime = Date.parse(a.observedAt) - Date.parse(b.observedAt);
    return byTime || stageRank[a.kind] - stageRank[b.kind] || a.evidenceRef.localeCompare(b.evidenceRef);
  });
  const latest = ordered[ordered.length - 1];
  const distinctSources = new Set(ordered.map((item) => item.source)).size;

  return {
    workspaceId: input.workspaceId,
    leadId: input.leadId,
    maturity: distinctSources >= 2 ? "CORROBORATED" : "OBSERVED",
    observedSignals: ordered.map((item) => item.kind),
    evidenceRefs: ordered.map((item) => item.evidenceRef),
    stage: stageFrom(latest.kind),
    score: null,
    scoreReason: "SCORING_NOT_AUTHORIZED",
    causalClaim: false,
    humanReviewRequired: true,
    executable: false,
  };
}
