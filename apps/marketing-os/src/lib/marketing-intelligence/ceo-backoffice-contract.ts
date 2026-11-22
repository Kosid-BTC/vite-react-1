/**
 * CEO Back Office -> Marketing Intelligence contract.
 * Pure transformation only: no network, no privileged keys, no cross-project access.
 * Data is admitted only after independent identity, owner-attestation, audience and RLS gates.
 */
export type AudienceSegmentCode = 'employee' | 'graduate' | 'newbie' | 'seller' | 'growth';
export type OnboardingStage = 'pre_signup' | 'beginner_onboarding' | 'post_onboarding';

export type AudienceContext = {
  segmentCode: AudienceSegmentCode;
  onboardingStage: OnboardingStage;
  hasVerifiedBusinessSignals: boolean;
};

/**
 * Positioning decision, 2026-11-15:
 * - seller is a hypothesis segment for owners who already have something to sell but are not found.
 * - growth remains the segment for owners who need systematic growth.
 * - food and palm are business types, not audience segments.
 */
export const SELLER_SEGMENT_POLICY = {
  code: 'seller',
  evidenceStatus: 'hypothesis',
  primaryPain: 'มีของขายแล้วแต่ลูกค้าหาไม่เจอ',
  intelligenceStage: 'post_onboarding',
} as const;

export const BUSINESS_TYPE_NOT_SEGMENT = ['food', 'palm'] as const;

export function isBackOfficeIntelligenceEligible(context: AudienceContext): boolean {
  return context.onboardingStage === 'post_onboarding'
    && context.hasVerifiedBusinessSignals
    && (context.segmentCode === 'seller' || context.segmentCode === 'growth');
}

export type Evidence = {
  sourceProject: 'ceo-ai-backoffice';
  sourceTable: string;
  sourceRecordId: string;
  observedAt: string;
};

export type MarketingSignal = {
  metric: 'revenue' | 'gross_margin' | 'customer_count' | 'repeat_purchase_rate';
  value: number;
  unit: 'THB' | 'count' | 'ratio';
  periodStart: string;
  periodEnd: string;
  evidence: Evidence;
};

export type IntelligenceSnapshot = {
  primaryWorkspaceId: string;
  supplementaryWorkspaceId: string;
  audienceSegmentCode: 'seller' | 'growth';
  generatedAt: string;
  signals: MarketingSignal[];
  unavailableMetrics: MarketingSignal['metric'][];
};

export type OwnerConsentAttestation = {
  projectRef: 'bjozpwdtqbpwcxnqguka' | 'waigsnxhrlwtiotspaim';
  workspaceId: string;
  ownerUserId: string;
  consentEventId: string;
  evidenceSha256: string;
  verifiedAt: string;
};

/**
 * Trusted-server attestation envelope only.
 * A client-supplied object is NOT proof: the runtime service must independently
 * authenticate the owner in each project's Auth context, verify both consent
 * events and their evidence digests, and load this record from the protected registry.
 */
export type MappingAttestation = {
  primary: OwnerConsentAttestation & { projectRef: 'bjozpwdtqbpwcxnqguka' };
  supplementary: OwnerConsentAttestation & { projectRef: 'waigsnxhrlwtiotspaim' };
  reviewedByUserId: string;
  reviewedBy: string;
  expiresAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
};

const isNonBlank = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const isSha256Digest = (value: string): boolean => /^[0-9a-f]{64}$/.test(value);

/**
 * Validate a trusted server-produced attestation envelope against explicit IDs.
 * This is a pure shape/time check, NOT independent Auth verification or RLS proof.
 */
export function isMappingAttested(
  mapping: MappingAttestation | null,
  primaryWorkspaceId: string,
  supplementaryWorkspaceId: string,
  now: Date,
): boolean {
  if (!mapping) return false;
  if (!isNonBlank(primaryWorkspaceId) || !isNonBlank(supplementaryWorkspaceId)) return false;

  // Revocation is terminal for this attestation. Mismatched timestamp/reason pairs fail closed.
  if (mapping.revokedAt !== null || mapping.revocationReason !== null) return false;
  if (!isNonBlank(mapping.reviewedByUserId) || !isNonBlank(mapping.reviewedBy)) return false;

  const primary = mapping.primary;
  const supplementary = mapping.supplementary;
  if (!primary || !supplementary) return false;

  const primaryVerified = Date.parse(primary.verifiedAt);
  const supplementaryVerified = Date.parse(supplementary.verifiedAt);
  const expires = Date.parse(mapping.expiresAt);
  const nowMs = now.getTime();

  const primaryValid = primary.projectRef === 'bjozpwdtqbpwcxnqguka'
    && primary.workspaceId === primaryWorkspaceId
    && isNonBlank(primary.ownerUserId)
    && isNonBlank(primary.consentEventId)
    && isSha256Digest(primary.evidenceSha256)
    && Number.isFinite(primaryVerified)
    && primaryVerified <= nowMs;

  const supplementaryValid = supplementary.projectRef === 'waigsnxhrlwtiotspaim'
    && supplementary.workspaceId === supplementaryWorkspaceId
    && isNonBlank(supplementary.ownerUserId)
    && isNonBlank(supplementary.consentEventId)
    && isSha256Digest(supplementary.evidenceSha256)
    && Number.isFinite(supplementaryVerified)
    && supplementaryVerified <= nowMs;

  return primaryValid && supplementaryValid
    && isNonBlank(mapping.expiresAt)
    && Number.isFinite(expires)
    && expires > nowMs
    && expires > Math.max(primaryVerified, supplementaryVerified);
}

/** Explicitly preserve missing metrics; never fabricate business KPIs. */
export function buildMarketingIntelligenceSnapshot(input: {
  primaryWorkspaceId: string;
  supplementaryWorkspaceId: string;
  audience: AudienceContext;
  mapping: MappingAttestation | null;
  now: Date;
  signals: MarketingSignal[];
}): IntelligenceSnapshot | null {
  if (!isBackOfficeIntelligenceEligible(input.audience)) return null;
  if (!isMappingAttested(input.mapping, input.primaryWorkspaceId, input.supplementaryWorkspaceId, input.now)) return null;

  const allowed: MarketingSignal['metric'][] = ['revenue', 'gross_margin', 'customer_count', 'repeat_purchase_rate'];
  const signals = input.signals.filter(s =>
    allowed.includes(s.metric) && Number.isFinite(s.value) && s.value >= 0
    && isNonBlank(s.evidence.sourceTable)
    && isNonBlank(s.evidence.sourceRecordId)
    && s.evidence.sourceProject === 'ceo-ai-backoffice'
    && Number.isFinite(Date.parse(s.evidence.observedAt))
    && Number.isFinite(Date.parse(s.periodStart))
    && Number.isFinite(Date.parse(s.periodEnd))
    && Date.parse(s.periodStart) <= Date.parse(s.periodEnd)
    && (s.unit === (s.metric === 'revenue' ? 'THB' : s.metric === 'customer_count' ? 'count' : 'ratio'))
    && (s.metric !== 'gross_margin' && s.metric !== 'repeat_purchase_rate' || s.value >= 0 && s.value <= 1)
    && (s.metric !== 'customer_count' || s.value >= 0 && Number.isInteger(s.value))
  );

  return {
    primaryWorkspaceId: input.primaryWorkspaceId,
    supplementaryWorkspaceId: input.supplementaryWorkspaceId,
    audienceSegmentCode: input.audience.segmentCode as 'seller' | 'growth',
    generatedAt: input.now.toISOString(),
    signals,
    unavailableMetrics: allowed.filter(metric => !signals.some(s => s.metric === metric)),
  };
}
