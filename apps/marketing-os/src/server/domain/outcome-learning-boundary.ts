import type { Evidence, EvidenceTruthStatus } from './skill-contract';
import type { NextBestActionProposal } from './decision-boundary';

export type ExperimentPlanStatus = 'MANUAL_REVIEW_READY' | 'BLOCKED';
export type LearningStatus = 'LEARNING_READY';

export interface ExperimentPlan {
  kind: 'EXPERIMENT_PLAN';
  sourceActionKey: string;
  sourceEvidenceIds: string[];
  humanDecision: NextBestActionProposal['humanDecision'];
  status: ExperimentPlanStatus;
  executionMode: 'MANUAL_ONLY';
  executable: false;
}

export interface OutcomeRecord {
  kind: 'OUTCOME_RECORD';
  sourceActionKey: string;
  sourceEvidenceIds: string[];
  outcomeEvidenceId: string;
  truthStatus: EvidenceTruthStatus;
}

export interface LearningRecord {
  kind: 'LEARNING_RECORD';
  status: LearningStatus;
  sourceActionKey: string;
  evidenceIds: string[];
  nextCycle: {
    kind: 'NEXT_CYCLE_REVIEW_PROPOSAL';
    executable: false;
  };
}

const TRUSTED_OUTCOME_STATUSES = new Set<EvidenceTruthStatus>(['MEASURED', 'DERIVED']);

function evidenceIdentity(evidence: Evidence): string {
  return evidence.id ?? evidence.idempotencyKey;
}

export function createExperimentPlan(proposal: NextBestActionProposal): ExperimentPlan {
  const approved = proposal.humanDecision === 'APPROVED';

  return {
    kind: 'EXPERIMENT_PLAN',
    sourceActionKey: proposal.actionKey,
    sourceEvidenceIds: proposal.evidenceIds,
    humanDecision: proposal.humanDecision,
    status: approved ? 'MANUAL_REVIEW_READY' : 'BLOCKED',
    executionMode: 'MANUAL_ONLY',
    executable: false,
  };
}

export function recordTrustedOutcome(plan: ExperimentPlan, evidence: Evidence): OutcomeRecord {
  if (plan.status !== 'MANUAL_REVIEW_READY' || plan.humanDecision !== 'APPROVED') {
    throw new Error('Outcome cannot be recorded before an approved Human Decision');
  }

  if (evidence.kind !== 'outcome') {
    throw new Error('Outcome learning requires canonical Evidence.kind = outcome');
  }

  if (!TRUSTED_OUTCOME_STATUSES.has(evidence.truthStatus)) {
    throw new Error('Outcome learning requires trusted MEASURED or DERIVED evidence');
  }

  return {
    kind: 'OUTCOME_RECORD',
    sourceActionKey: plan.sourceActionKey,
    sourceEvidenceIds: plan.sourceEvidenceIds,
    outcomeEvidenceId: evidenceIdentity(evidence),
    truthStatus: evidence.truthStatus,
  };
}

export function deriveLearning(outcome: OutcomeRecord): LearningRecord {
  return {
    kind: 'LEARNING_RECORD',
    status: 'LEARNING_READY',
    sourceActionKey: outcome.sourceActionKey,
    evidenceIds: [...outcome.sourceEvidenceIds, outcome.outcomeEvidenceId],
    nextCycle: {
      kind: 'NEXT_CYCLE_REVIEW_PROPOSAL',
      executable: false,
    },
  };
}
