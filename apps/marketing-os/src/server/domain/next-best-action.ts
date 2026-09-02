import type { LeadSalesAssessment } from "./lead-sales-intelligence";

export type NextBestAction =
  | "COLLECT_EVIDENCE"
  | "REVIEW_LEAD_CONTEXT"
  | "PREPARE_HUMAN_FOLLOW_UP"
  | "PREPARE_DISCOVERY"
  | "PREPARE_PROPOSAL_REVIEW"
  | "REVIEW_CUSTOMER_OUTCOME"
  | "REVIEW_LOSS_EVIDENCE";

export type NextBestActionRecommendation = {
  workspaceId: string;
  leadId: string;
  action: NextBestAction;
  evidenceMaturity: LeadSalesAssessment["maturity"];
  stage: LeadSalesAssessment["stage"];
  evidenceRefs: string[];
  score: null;
  scoreReason: "SCORING_NOT_AUTHORIZED";
  causalClaim: false;
  humanReviewRequired: true;
  humanApprovalRequired: true;
  executable: false;
};

const actionByStage: Record<LeadSalesAssessment["stage"], NextBestAction> = {
  UNKNOWN: "COLLECT_EVIDENCE",
  LEAD: "REVIEW_LEAD_CONTEXT",
  ENGAGED: "PREPARE_HUMAN_FOLLOW_UP",
  QUALIFIED: "PREPARE_DISCOVERY",
  OPPORTUNITY: "PREPARE_PROPOSAL_REVIEW",
  CUSTOMER: "REVIEW_CUSTOMER_OUTCOME",
  LOST: "REVIEW_LOSS_EVIDENCE",
};

export function recommendNextBestAction(input: {
  workspaceId: string;
  leadId: string;
  assessment: LeadSalesAssessment;
}): NextBestActionRecommendation {
  const { assessment } = input;

  if (assessment.workspaceId !== input.workspaceId || assessment.leadId !== input.leadId) {
    throw new Error("NEXT_BEST_ACTION_SCOPE_MISMATCH");
  }

  if (
    assessment.score !== null ||
    assessment.scoreReason !== "SCORING_NOT_AUTHORIZED" ||
    assessment.causalClaim !== false ||
    assessment.humanReviewRequired !== true ||
    assessment.executable !== false
  ) {
    throw new Error("NEXT_BEST_ACTION_UNTRUSTED_ASSESSMENT");
  }

  const action =
    assessment.maturity === "INSUFFICIENT"
      ? "COLLECT_EVIDENCE"
      : actionByStage[assessment.stage];

  return {
    workspaceId: input.workspaceId,
    leadId: input.leadId,
    action,
    evidenceMaturity: assessment.maturity,
    stage: assessment.stage,
    evidenceRefs: [...assessment.evidenceRefs],
    score: null,
    scoreReason: "SCORING_NOT_AUTHORIZED",
    causalClaim: false,
    humanReviewRequired: true,
    humanApprovalRequired: true,
    executable: false,
  };
}
