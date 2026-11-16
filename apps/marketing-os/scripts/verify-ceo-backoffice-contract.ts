/** Pure contract regression checks. Run: npx tsx scripts/verify-ceo-backoffice-contract.ts */
import assert from 'node:assert/strict';
import {
  isBackOfficeIntelligenceEligible,
  isMappingAttested,
  buildMarketingIntelligenceSnapshot,
  type AudienceContext,
  type MappingAttestation,
  type MarketingSignal,
} from '../src/lib/marketing-intelligence/ceo-backoffice-contract';

const now = new Date('2026-11-15T12:00:00.000Z');
const audience: AudienceContext = { segmentCode: 'seller', onboardingStage: 'post_onboarding', hasVerifiedBusinessSignals: true };
const mapping: MappingAttestation = { primaryWorkspaceId: 'primary-a', supplementaryWorkspaceId: 'target-a', verifiedBy: 'independent-owner-attestation', verifiedAt: '2026-11-14T00:00:00Z', expiresAt: '2026-11-16T00:00:00Z', status: 'approved' };
const evidence = { sourceProject: 'ceo-ai-backoffice' as const, sourceTable: 'verified_sales', sourceRecordId: 'record-1', observedAt: '2026-11-15T11:00:00Z' };
const signal: MarketingSignal = { metric: 'revenue', value: 100, unit: 'THB', periodStart: '2026-11-01', periodEnd: '2026-11-15', evidence };
const build = (attestation: MappingAttestation | null, signals: MarketingSignal[] = [signal], audienceContext: AudienceContext = audience) => buildMarketingIntelligenceSnapshot({ primaryWorkspaceId: 'primary-a', supplementaryWorkspaceId: 'target-a', audience: audienceContext, mapping: attestation, now, signals });

assert.equal(isBackOfficeIntelligenceEligible(audience), true);
assert.equal(build(mapping, [signal], { ...audience, onboardingStage: 'pre_signup' }), null, 'pre-signup must not receive advanced KPIs');
assert.equal(build(mapping, [signal], { ...audience, segmentCode: 'newbie' }), null, 'beginner segment must not receive advanced KPIs');
assert.equal(build(mapping, [signal], { ...audience, hasVerifiedBusinessSignals: false }), null, 'missing verified business signals must fail closed');
assert.equal(isMappingAttested(null, 'primary-a', 'target-a', now), false, 'missing mapping must fail closed');
assert.equal(build(null), null, 'no mapping: no snapshot');
assert.equal(build({ ...mapping, status: 'revoked' }), null, 'revoked mapping');
assert.equal(build({ ...mapping, expiresAt: '2026-11-15T12:00:00Z' }), null, 'expired mapping');
assert.equal(build({ ...mapping, verifiedAt: '2026-11-16T00:00:00Z' }), null, 'future attestation');
assert.equal(build({ ...mapping, supplementaryWorkspaceId: 'target-b' }), null, 'cross-tenant target mismatch');
assert.equal(build({ ...mapping, primaryWorkspaceId: 'primary-b' }), null, 'cross-tenant primary mismatch');
assert.equal(build({ ...mapping, verifiedBy: '' }), null, 'anonymous attestation');
const snapshot = build(mapping);
assert.ok(snapshot, 'valid mapping and audience yield pure snapshot');
assert.equal(snapshot.audienceSegmentCode, 'seller');
assert.equal(snapshot.signals.length, 1);
assert.deepEqual(snapshot.unavailableMetrics, ['gross_margin', 'customer_count', 'repeat_purchase_rate'], 'missing KPI must not be invented');
const invalid: MarketingSignal[] = [
  { ...signal, value: Number.NaN },
  { ...signal, evidence: { ...evidence, sourceRecordId: '' } },
  { ...signal, evidence: { ...evidence, sourceProject: 'ceo-ai-backoffice', observedAt: 'invalid' } },
  { ...signal, periodStart: '2026-11-20', periodEnd: '2026-11-01' },
  { ...signal, unit: 'count' },
  { ...signal, metric: 'customer_count', value: 1.5, unit: 'count' },
  { ...signal, metric: 'gross_margin', value: 1.2, unit: 'ratio' },
  { ...signal, metric: 'repeat_purchase_rate', value: -0.1, unit: 'ratio' },
];
assert.equal(build(mapping, invalid)?.signals.length, 0, 'invalid evidence, values and units rejected');
console.log('PASS: CEO Back Office contract checks (audience, mapping, tenant mismatch, provenance, missing KPI)');
