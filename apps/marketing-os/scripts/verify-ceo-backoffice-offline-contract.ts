// Offline contract regression: no credentials, DB connection, or tenant data required.
import assert from 'node:assert/strict';
import {
  AUDIENCE_ALIAS_MAP,
  BUSINESS_TYPE_NOT_SEGMENT,
  SELLER_SEGMENT_POLICY,
  resolveAudienceAlias,
  isBackOfficeIntelligenceEligible,
  isMappingAttested,
  buildMarketingIntelligenceSnapshot,
  type MappingAttestation,
  type MarketingSignal,
} from '../src/lib/marketing-intelligence/ceo-backoffice-contract';

const now = new Date('2026-11-16T00:00:00.000Z');
const primaryWorkspaceId = 'primary-tenant-a';
const supplementaryWorkspaceId = 'backoffice-tenant-a';
const approved: MappingAttestation = {
  primary: {
    projectRef: 'bjozpwdtqbpwcxnqguka',
    workspaceId: primaryWorkspaceId,
    ownerUserId: 'primary-owner-a',
    consentEventId: 'primary-consent-event-a',
    evidenceSha256: 'a'.repeat(64),
    verifiedAt: '2026-11-15T00:00:00.000Z',
  },
  supplementary: {
    projectRef: 'waigsnxhrlwtiotspaim',
    workspaceId: supplementaryWorkspaceId,
    ownerUserId: 'backoffice-owner-a',
    consentEventId: 'backoffice-consent-event-a',
    evidenceSha256: 'b'.repeat(64),
    verifiedAt: '2026-11-15T01:00:00.000Z',
  },
  reviewedByUserId: 'reviewer-user-1',
  reviewedBy: 'independent-security-reviewer',
  expiresAt: '2026-11-17T00:00:00.000Z',
  revokedAt: null,
  revocationReason: null,
};
const sellerAudience = {
  segmentCode: 'seller' as const,
  onboardingStage: 'post_onboarding' as const,
  hasVerifiedBusinessSignals: true,
};
const evidence = {
  sourceProject: 'ceo-ai-backoffice' as const,
  sourceTable: 'verified_sales',
  sourceRecordId: 'record-1',
  observedAt: now.toISOString(),
};
const validSignal: MarketingSignal = {
  metric: 'revenue',
  value: 500,
  unit: 'THB',
  periodStart: '2026-11-01',
  periodEnd: '2026-11-15',
  evidence,
};
const args = {
  primaryWorkspaceId,
  supplementaryWorkspaceId,
  audience: sellerAudience,
  now,
  mapping: approved,
};
const build = (overrides: Partial<Parameters<typeof buildMarketingIntelligenceSnapshot>[0]> = {}) =>
  buildMarketingIntelligenceSnapshot({ ...args, signals: [validSignal], ...overrides });

assert.deepEqual(AUDIENCE_ALIAS_MAP, { employee: 'sidebiz', growth: 'owner' });
assert.equal(resolveAudienceAlias('employee'), 'sidebiz');
assert.equal(resolveAudienceAlias('growth'), 'owner');
assert.equal(SELLER_SEGMENT_POLICY.evidenceStatus, 'hypothesis');
assert.equal(SELLER_SEGMENT_POLICY.primaryPain, 'มีของขายแล้วแต่ลูกค้าหาไม่เจอ');
assert.deepEqual(BUSINESS_TYPE_NOT_SEGMENT, ['food', 'palm']);
assert.equal(isBackOfficeIntelligenceEligible(sellerAudience), true);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, segmentCode: 'growth' }), true);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, segmentCode: 'employee' }), false, 'employee alias does not bypass beginner-only eligibility');
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, segmentCode: 'graduate' }), false);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, segmentCode: 'newbie' }), false);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, onboardingStage: 'pre_signup' }), false);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, onboardingStage: 'beginner_onboarding' }), false);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, hasVerifiedBusinessSignals: false }), false);

assert.equal(isMappingAttested(null, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, revokedAt: now.toISOString(), revocationReason: 'owner revoked' }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, revocationReason: 'missing timestamp' }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, expiresAt: now.toISOString() }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, primary: { ...approved.primary, projectRef: 'waigsnxhrlwtiotspaim' } } as unknown as MappingAttestation, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, supplementary: { ...approved.supplementary, projectRef: 'bjozpwdtqbpwcxnqguka' } } as unknown as MappingAttestation, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, primary: { ...approved.primary, ownerUserId: '' } }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, supplementary: { ...approved.supplementary, consentEventId: ' ' } }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, primary: { ...approved.primary, evidenceSha256: 'invalid' } }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, reviewedByUserId: ' ' }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, supplementary: { ...approved.supplementary, verifiedAt: '2026-11-18T00:00:00.000Z' } }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested(approved, primaryWorkspaceId, 'backoffice-tenant-b', now), false);

assert.equal(build({ audience: { ...sellerAudience, onboardingStage: 'pre_signup' } }), null);
assert.equal(build({ audience: { ...sellerAudience, segmentCode: 'newbie' } }), null);
assert.equal(build({ mapping: null }), null);
assert.equal(build({ mapping: { ...approved, revokedAt: now.toISOString(), revocationReason: 'revoked' } }), null);
assert.equal(build({ primaryWorkspaceId: '' }), null, 'empty primary workspace must fail closed');
assert.equal(build({ supplementaryWorkspaceId: '' }), null, 'empty supplementary workspace must fail closed');

const snapshot = build();
assert.ok(snapshot);
assert.equal(snapshot.audienceSegmentCode, 'seller');
assert.equal(snapshot.signals.length, 1);
assert.equal(snapshot.signals[0].value, 500);
assert.deepEqual(snapshot.unavailableMetrics, ['gross_margin', 'customer_count', 'repeat_purchase_rate']);
assert.equal(snapshot.primaryWorkspaceId, primaryWorkspaceId);
assert.equal(snapshot.supplementaryWorkspaceId, supplementaryWorkspaceId);

const invalidSignals: MarketingSignal[] = [
  { ...validSignal, value: -1 },
  { ...validSignal, value: Number.NaN },
  { ...validSignal, evidence: { ...evidence, sourceRecordId: '' } },
  { ...validSignal, periodStart: '2026-12-01' },
  { ...validSignal, metric: 'customer_count', value: 1.5, unit: 'count' },
  { ...validSignal, metric: 'gross_margin', value: 1.5, unit: 'ratio' },
];
assert.equal(build({ signals: invalidSignals })?.signals.length, 0);
console.log('PASS: offline CEO Back Office contract regression (dual owner evidence, audience, provenance, no live access)');
