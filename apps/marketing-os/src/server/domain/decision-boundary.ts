import type { Evidence, EvidenceTruthStatus } from './skill-contract';

export type MeasurementHealthStatus = 'HEALTHY' | 'INSUFFICIENT_EVIDENCE' | 'UNTRUSTED_EVIDENCE';
export type DiagnosisCode = 'READY_FOR_ACTION' | 'COLLECT_MORE_EVIDENCE' | 'EVIDENCE_NOT_TRUSTED';
export type HumanDecisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MeasurementHealth {
  status: MeasurementHealthStatus;
  evidenceIds: string[];
  trustedEvidenceCount: number;
  totalEvidenceCount: number;
}

export interface Diagnosis {
  code: DiagnosisCode;
  rationale: string;
  evidenceIds: string[];
}

export interface NextBestActionProposal {
  kind: 'NBA_PROPOSAL';
  actionKey: string;
  rationale: string;
  evidenceIds: string[];
  humanDecision: HumanDecisionStatus;
  executable: false;
}

const TRUSTED_STATUSES = new Set<EvidenceTruthStatus>(['MEASURED', 'DERIVED']);

function evidenceIdentity(evidence: Evidence): string {
  return evidence.id ?? evidence.idempotencyKey;
}

export function deriveMeasurementHealth(evidence: Evidence[]): MeasurementHealth {
  const evidenceIds = evidence.map(evidenceIdentity);
  if (evidence.length === 0) {
    return {
      status: 'INSUFFICIENT_EVIDENCE',
      evidenceIds,
      trustedEvidenceCount: 0,
      totalEvidenceCount: 0,
    };
  }

  const trustedEvidenceCount = evidence.filter((item) => TRUSTED_STATUSES.has(item.truthStatus)).length;
  if (trustedEvidenceCount === 0) {
    return {
      status: 'UNTRUSTED_EVIDENCE',
      evidenceIds,
      trustedEvidenceCount,
      totalEvidenceCount: evidence.length,
    };
  }

  return {
    status: 'HEALTHY',
    evidenceIds,
    trustedEvidenceCount,
    totalEvidenceCount: evidence.length,
  };
}

export function diagnoseGrowth(health: MeasurementHealth): Diagnosis {
  if (health.status === 'INSUFFICIENT_EVIDENCE') {
    return {
      code: 'COLLECT_MORE_EVIDENCE',
      rationale: 'No trusted evidence is available; collect evidence before drawing a strategic conclusion.',
      evidenceIds: health.evidenceIds,
    };
  }

  if (health.status === 'UNTRUSTED_EVIDENCE') {
    return {
      code: 'EVIDENCE_NOT_TRUSTED',
      rationale: 'Available evidence is assumed, placeholder, or unavailable and cannot drive a strategic NBA.',
      evidenceIds: health.evidenceIds,
    };
  }

  return {
    code: 'READY_FOR_ACTION',
    rationale: 'Trusted evidence is available for a human-reviewed next-best-action proposal.',
    evidenceIds: health.evidenceIds,
  };
}

export function proposeNextBestAction(diagnosis: Diagnosis): NextBestActionProposal {
  const actionKey =
    diagnosis.code === 'READY_FOR_ACTION'
      ? 'REVIEW_GROWTH_EXPERIMENT'
      : diagnosis.code === 'COLLECT_MORE_EVIDENCE'
        ? 'COLLECT_MORE_EVIDENCE'
        : 'REMEDIATE_EVIDENCE_QUALITY';

  return {
    kind: 'NBA_PROPOSAL',
    actionKey,
    rationale: diagnosis.rationale,
    evidenceIds: diagnosis.evidenceIds,
    humanDecision: 'PENDING',
    executable: false,
  };
}

export function applyHumanDecision(
  proposal: NextBestActionProposal,
  decision: Exclude<HumanDecisionStatus, 'PENDING'>,
): NextBestActionProposal {
  return {
    ...proposal,
    humanDecision: decision,
    executable: false,
  };
}
