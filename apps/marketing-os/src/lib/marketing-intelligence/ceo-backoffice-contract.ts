/**
 * CEO Back Office -> Marketing Intelligence contract.
 * Pure transformation only: no network, no privileged keys, no cross-project access.
 * Data is admitted only after signed consent-receipt verification, audience and RLS gates.
 */
export type AudienceSegmentCode = 'employee' | 'graduate' | 'newbie' | 'seller' | 'growth';
export type AudienceAlias = 'sidebiz' | 'owner' | 'seller' | 'graduate' | 'newbie';
export type OnboardingStage = 'pre_signup' | 'beginner_onboarding' | 'post_onboarding';

/**
 * Canonical aliases only; these do NOT create or rename audience-segment rows.
 * employee stays in the beginner journey; growth remains the stored segment and
 * resolves to the canonical owner alias for downstream business mapping.
 */
export const AUDIENCE_ALIAS_MAP = {
  employee: 'sidebiz',
  growth: 'owner',
} as const satisfies Partial<Record<AudienceSegmentCode, AudienceAlias>>;

export function resolveAudienceAlias(segmentCode: AudienceSegmentCode): AudienceAlias {
  const aliases = AUDIENCE_ALIAS_MAP as Partial<Record<AudienceSegmentCode, AudienceAlias>>;
  return aliases[segmentCode] ?? segmentCode as AudienceAlias;
}

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
  audienceAlias: 'seller' | 'owner';
  generatedAt: string;
  signals: MarketingSignal[];
  unavailableMetrics: MarketingSignal['metric'][];
};

export type DevelopmentConsentReceiptAttestation = {
  projectRef: 'roprejhnhoaqlctltwfs' | 'tdeuyycqbbktacmxgktn';
  workspaceId: string;
  consentEventId: string;
  consentReceiptSha256: string;
  issuerKeyId: string;
  challengeId: string;
  audience: 'marketing-os-workspace-mapping';
  scope: 'marketing.backoffice.export';
  verifiedAt: string;
};

/**
 * Development-only receipt envelope shape.
 * This pure contract checks structure and time bounds only. It does NOT verify
 * signatures, owner control, receipt revocation at the issuer, or RLS. A trusted
 * Development verifier must do those checks independently before issuing this envelope.
 * No cross-system person identifier or reviewer identity is represented here.
 */
export type DevelopmentMappingAttestation = {
  primary: DevelopmentConsentReceiptAttestation & { projectRef: 'roprejhnhoaqlctltwfs' };
  supplementary: DevelopmentConsentReceiptAttestation & { projectRef: 'tdeuyycqbbktacmxgktn' };
  challengeId: string;
  expiresAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
};

const isNonBlank = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isWorkspaceUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

const isAudienceContext = (value: unknown): value is AudienceContext => {
  if (!value || typeof value !== 'object') return false;
  const context = value as Partial<AudienceContext>;
  return (context.segmentCode === 'employee'
      || context.segmentCode === 'graduate'
      || context.segmentCode === 'newbie'
      || context.segmentCode === 'seller'
      || context.segmentCode === 'growth')
    && (context.onboardingStage === 'pre_signup'
      || context.onboardingStage === 'beginner_onboarding'
      || context.onboardingStage === 'post_onboarding')
    && typeof context.hasVerifiedBusinessSignals === 'boolean';
};

const isSha256Digest = (value: string): boolean => /^[0-9a-f]{64}$/.test(value);

/**
 * Validate a Development attestation envelope against explicit UUIDs.
 * This is a pure shape/time check, NOT independent Auth verification or RLS proof.
 */
export function isMappingAttested(
  mapping: DevelopmentMappingAttestation | null,
  primaryWorkspaceId: string,
  supplementaryWorkspaceId: string,
  now: Date,
): boolean {
  // Runtime callers may cross this boundary with untrusted JSON despite the static type.
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) return false;
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return false;
  if (!isWorkspaceUuid(primaryWorkspaceId) || !isWorkspaceUuid(supplementaryWorkspaceId)) return false;

  // Revocation is terminal for this attestation. Mismatched timestamp/reason pairs fail closed.
  if (mapping.revokedAt !== null || mapping.revocationReason !== null) return false;
  if (!isNonBlank(mapping.challengeId)) return false;

  const primary = mapping.primary;
  const supplementary = mapping.supplementary;
  if (!primary || !supplementary) return false;

  const primaryVerified = Date.parse(primary.verifiedAt);
  const supplementaryVerified = Date.parse(supplementary.verifiedAt);
  const expires = Date.parse(mapping.expiresAt);
  const nowMs = now.getTime();

  const primaryValid = primary.projectRef === 'roprejhnhoaqlctltwfs'
    && primary.workspaceId === primaryWorkspaceId
    && isNonBlank(primary.consentEventId)
    && isSha256Digest(primary.consentReceiptSha256)
    && isNonBlank(primary.issuerKeyId)
    && primary.challengeId === mapping.challengeId
    && primary.audience === 'marketing-os-workspace-mapping'
    && primary.scope === 'marketing.backoffice.export'
    && Number.isFinite(primaryVerified)
    && primaryVerified <= nowMs;

  const supplementaryValid = supplementary.projectRef === 'tdeuyycqbbktacmxgktn'
    && supplementary.workspaceId === supplementaryWorkspaceId
    && isNonBlank(supplementary.consentEventId)
    && isSha256Digest(supplementary.consentReceiptSha256)
    && isNonBlank(supplementary.issuerKeyId)
    && supplementary.challengeId === mapping.challengeId
    && supplementary.audience === 'marketing-os-workspace-mapping'
    && supplementary.scope === 'marketing.backoffice.export'
    && Number.isFinite(supplementaryVerified)
    && supplementaryVerified <= nowMs;

  return primaryValid && supplementaryValid
    && isNonBlank(mapping.expiresAt)
    && Number.isFinite(expires)
    && expires > nowMs
    && expires > Math.max(primaryVerified, supplementaryVerified);
}

/** Explicitly preserve missing metrics; never fabricate business KPIs. */
export function buildMarketingIntelligenceSnapshot(input: unknown): IntelligenceSnapshot | null {
  // The public boundary accepts unknown because runtime JSON is not protected by TypeScript types.
  if (!input || typeof input !== 'object') return null;
  const candidate = input as {
    primaryWorkspaceId?: unknown;
    supplementaryWorkspaceId?: unknown;
    audience?: unknown;
    mapping?: unknown;
    now?: unknown;
    signals?: unknown;
  };
  const primaryWorkspaceId = candidate.primaryWorkspaceId;
  const supplementaryWorkspaceId = candidate.supplementaryWorkspaceId;
  const audienceContext = candidate.audience;
  const now = candidate.now;

  if (!isWorkspaceUuid(primaryWorkspaceId) || !isWorkspaceUuid(supplementaryWorkspaceId)) return null;
  if (!isAudienceContext(audienceContext)) return null;
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return null;
  if (!isBackOfficeIntelligenceEligible(audienceContext)) return null;
  const audienceAlias = resolveAudienceAlias(audienceContext.segmentCode);
  if (audienceAlias !== 'seller' && audienceAlias !== 'owner') return null;

  const mapping = candidate.mapping && typeof candidate.mapping === 'object'
    ? candidate.mapping as DevelopmentMappingAttestation
    : null;
  if (!isMappingAttested(mapping, primaryWorkspaceId, supplementaryWorkspaceId, now)) return null;

  const allowed: MarketingSignal['metric'][] = ['revenue', 'gross_margin', 'customer_count', 'repeat_purchase_rate'];
  // Treat runtime JSON as untrusted even though this pure contract is statically typed.
  // A malformed collection fails closed; malformed individual rows are excluded.
  if (!Array.isArray(candidate.signals)) return null;
  const signals = candidate.signals.filter((candidateSignal): candidateSignal is MarketingSignal => {
    if (!candidateSignal || typeof candidateSignal !== 'object') return false;
    const s = candidateSignal as Partial<MarketingSignal>;
    if (typeof s.metric !== 'string' || !allowed.includes(s.metric as MarketingSignal['metric'])) return false;
    if (typeof s.value !== 'number' || !Number.isFinite(s.value) || s.value < 0) return false;
    if (!isNonBlank(s.periodStart) || !isNonBlank(s.periodEnd)) return false;
    if (!isNonBlank(s.unit)) return false;
    const evidence = s.evidence;
    if (!evidence || typeof evidence !== 'object') return false;
    const e = evidence as Partial<Evidence>;
    if (e.sourceProject !== 'ceo-ai-backoffice'
      || !isNonBlank(e.sourceTable)
      || !isNonBlank(e.sourceRecordId)
      || !isNonBlank(e.observedAt)
      || !Number.isFinite(Date.parse(e.observedAt))
      || !Number.isFinite(Date.parse(s.periodStart))
      || !Number.isFinite(Date.parse(s.periodEnd))
      || Date.parse(s.periodStart) > Date.parse(s.periodEnd)) return false;

    const expectedUnit = s.metric === 'revenue'
      ? 'THB'
      : s.metric === 'customer_count'
        ? 'count'
        : 'ratio';
    if (s.unit !== expectedUnit) return false;
    if ((s.metric === 'gross_margin' || s.metric === 'repeat_purchase_rate')
      && s.value > 1) return false;
    if (s.metric === 'customer_count' && !Number.isInteger(s.value)) return false;
    return true;
  });

  return {
    primaryWorkspaceId,
    supplementaryWorkspaceId,
    audienceSegmentCode: audienceContext.segmentCode as 'seller' | 'growth',
    audienceAlias,
    generatedAt: now.toISOString(),
    signals,
    unavailableMetrics: allowed.filter(metric => !signals.some(s => s.metric === metric)),
  };
}
