export type EvidenceTruthStatus =
  | 'MEASURED'
  | 'DERIVED'
  | 'ASSUMED'
  | 'PLACEHOLDER'
  | 'UNAVAILABLE';

export type EvidenceKind = 'metric' | 'outcome' | 'observation' | 'experiment';

export interface EvidenceProvenance {
  source: string;
  capturedAt: string;
  sourceRef?: string;
  method?: string;
}

/**
 * Canonical Growth Core evidence envelope used at the Marketing OS persistence boundary.
 * Persistence must preserve workspace/business identity, lineage, truth status and provenance.
 */
export interface Evidence {
  id?: string;
  workspaceId: string;
  businessId: string;
  campaignId?: string | null;
  contentItemId?: string | null;
  kind: EvidenceKind;
  outcomeKey: string;
  truthStatus: EvidenceTruthStatus;
  value: Record<string, unknown>;
  provenance: EvidenceProvenance;
  idempotencyKey: string;
  createdBy: string;
  createdAt?: string;
}

export function assertEvidenceIdentity(evidence: Evidence): void {
  if (!evidence.workspaceId || !evidence.businessId || !evidence.idempotencyKey) {
    throw new Error('Evidence identity requires workspaceId, businessId and idempotencyKey');
  }
  if (!evidence.provenance?.source || !evidence.provenance?.capturedAt) {
    throw new Error('Evidence provenance requires source and capturedAt');
  }
}
