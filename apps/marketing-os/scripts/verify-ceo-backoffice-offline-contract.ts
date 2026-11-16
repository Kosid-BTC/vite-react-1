// Offline contract regression: no credentials, DB connection, or tenant data required.
import assert from 'node:assert/strict';
import {
  BUSINESS_TYPE_NOT_SEGMENT,
  SELLER_SEGMENT_POLICY,
  isBackOfficeIntelligenceEligible,
  isMappingAttested,
  buildMarketingIntelligenceSnapshot,
} from '../src/lib/marketing-intelligence/ceo-backoffice-contract';

const now = new Date('2026-11-16T00:00:00.000Z');
const primaryWorkspaceId = 'primary-tenant-a';
const supplementaryWorkspaceId = 'backoffice-tenant-a';
const sellerAudience = {
  segmentCode: 'seller' as const,
  onboardingStage: 'post_onboarding' as const,
  hasVerifiedBusinessSignals: true,
};
const approved = {
  primaryWorkspaceId, supplementaryWorkspaceId,
  verifiedBy: 'independent-owner-proof',
  verifiedAt: '2026-11-15T00:00:00.000Z',
  expiresAt: '2026-11-17T00:00:00.000Z',
  status: 'approved' as const,
};
const args = { primaryWorkspaceId, supplementaryWorkspaceId, audience: sellerAudience, now, mapping: approved };

assert.equal(SELLER_SEGMENT_POLICY.evidenceStatus, 'hypothesis');
assert.equal(SELLER_SEGMENT_POLICY.primaryPain, 'มีของขายแล้วแต่ลูกค้าหาไม่เจอ');
assert.deepEqual(BUSINESS_TYPE_NOT_SEGMENT, ['food', 'palm']);
assert.equal(isBackOfficeIntelligenceEligible(sellerAudience), true);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, segmentCode: 'growth' }), true);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, segmentCode: 'employee' }), false);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, segmentCode: 'graduate' }), false);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, segmentCode: 'newbie' }), false);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, onboardingStage: 'pre_signup' }), false);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, onboardingStage: 'beginner_onboarding' }), false);
assert.equal(isBackOfficeIntelligenceEligible({ ...sellerAudience, hasVerifiedBusinessSignals: false }), false);

assert.equal(isMappingAttested(null, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, status: 'revoked' }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, expiresAt: now.toISOString() }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, verifiedAt: '2026-11-17T00:00:00.000Z' }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested(approved, primaryWorkspaceId, 'backoffice-tenant-b', now), false);
assert.equal(buildMarketingIntelligenceSnapshot({ ...args, audience: { ...sellerAudience, onboardingStage: 'pre_signup' }, signals: [] }), null);
assert.equal(buildMarketingIntelligenceSnapshot({ ...args, audience: { ...sellerAudience, segmentCode: 'newbie' }, signals: [] }), null);
assert.equal(buildMarketingIntelligenceSnapshot({ ...args, mapping: null, signals: [] }), null);
assert.equal(buildMarketingIntelligenceSnapshot({ ...args, mapping: { ...approved, status: 'revoked' }, signals: [] }), null);

const evidence = { sourceProject: 'ceo-ai-backoffice' as const, sourceTable: 'verified_financial_records', sourceRecordId: 'record-1', observedAt: now.toISOString() };
const valid = { metric: 'revenue' as const, value: 500, unit: 'THB' as const, periodStart: '2026-11-01', periodEnd: '2026-11-15', evidence };
const snapshot = buildMarketingIntelligenceSnapshot({ ...args, signals: [
 valid,
 { ...valid, value: Number.NaN },
 { ...valid, evidence: { ...evidence, sourceRecordId: '' } },
 { ...valid, periodStart: '2026-12-01' },
 { ...valid, metric: 'customer_count' as const, value: -2, unit: 'count' as const },
 { ...valid, metric: 'gross_margin' as const, value: 1.5, unit: 'ratio' as const },
 { ...valid, metric: 'repeat_purchase_rate' as const, value: -0.1, unit: 'ratio' as const },
] });
assert.ok(snapshot);
assert.equal(snapshot.audienceSegmentCode, 'seller');
assert.equal(snapshot.signals.length, 1);
assert.equal(snapshot.signals[0].value, 500);
assert.deepEqual(snapshot.unavailableMetrics, ['gross_margin', 'customer_count', 'repeat_purchase_rate']);
assert.equal(snapshot.primaryWorkspaceId, primaryWorkspaceId);
assert.equal(snapshot.supplementaryWorkspaceId, supplementaryWorkspaceId);
console.log('PASS: offline CEO Back Office contract regression (audience, mapping, provenance, no live access)');
