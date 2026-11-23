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
const audience: AudienceContext = {
  segmentCode: 'seller',
  onboardingStage: 'post_onboarding',
  hasVerifiedBusinessSignals: true,
};
const mapping: MappingAttestation = {
  primary: {
    projectRef: 'bjozpwdtqbpwcxnqguka',
    workspaceId: 'primary-a',
    ownerUserId: 'primary-owner-1',
    consentEventId: 'primary-consent-1',
    evidenceSha256: 'a'.repeat(64),
    verifiedAt: '2026-11-14T00:00:00Z',
  },
  supplementary: {
    projectRef: 'waigsnxhrlwtiotspaim',
    workspaceId: 'target-a',
    ownerUserId: 'supplementary-owner-1',
    consentEventId: 'supplementary-consent-1',
    evidenceSha256: 'b'.repeat(64),
    verifiedAt: '2026-11-14T01:00:00Z',
  },
  reviewedByUserId: 'reviewer-user-1',
  reviewedBy: 'independent-security-reviewer',
  expiresAt: '2026-11-16T00:00:00Z',
  revokedAt: null,
  revocationReason: null,
};
const evidence = {
  sourceProject: 'ceo-ai-backoffice' as const,
  sourceTable: 'verified_sales',
  sourceRecordId: 'record-1',
  observedAt: '2026-11-15T11:00:00Z',
};
const signal: MarketingSignal = {
  metric: 'revenue',
  value: 100,
  unit: 'THB',
  periodStart: '2026-11-01',
  periodEnd: '2026-11-15',
  evidence,
};
const build = (
  attestation: MappingAttestation | null,
  signals: MarketingSignal[] = [signal],
  audienceContext: AudienceContext = audience,
  primaryWorkspaceId = 'primary-a',
  supplementaryWorkspaceId = 'target-a',
) => buildMarketingIntelligenceSnapshot({
  primaryWorkspaceId,
  supplementaryWorkspaceId,
  audience: audienceContext,
  mapping: attestation,
  now,
  signals,
});

assert.equal(isBackOfficeIntelligenceEligible(audience), true);
assert.equal(build(mapping, [signal], { ...audience, onboardingStage: 'pre_signup' }), null, 'pre-signup must not receive advanced KPIs');
assert.equal(build(mapping, [signal], { ...audience, segmentCode: 'newbie' }), null, 'beginner segment must not receive advanced KPIs');
assert.equal(build(mapping, [signal], { ...audience, hasVerifiedBusinessSignals: false }), null, 'missing verified business signals must fail closed');
assert.equal(isMappingAttested(null, 'primary-a', 'target-a', now), false, 'missing mapping must fail closed');
assert.equal(build(null), null, 'no mapping: no snapshot');
assert.equal(build({ ...mapping, revokedAt: '2026-11-15T11:00:00Z', revocationReason: 'owner revoked' }), null, 'revoked mapping');
assert.equal(build({ ...mapping, revocationReason: 'reason without timestamp' }), null, 'revocation reason without timestamp');
assert.equal(build({ ...mapping, expiresAt: '2026-11-15T12:00:00Z' }), null, 'expiry boundary');
assert.equal(build({ ...mapping, expiresAt: '2026-11-14T00:30:00Z' }), null, 'expiry before latest owner verification');
assert.equal(build({ ...mapping, primary: { ...mapping.primary, verifiedAt: '2026-11-16T00:00:00Z' } }), null, 'future primary owner attestation');
assert.equal(build({ ...mapping, supplementary: { ...mapping.supplementary, verifiedAt: '2026-11-16T00:00:00Z' } }), null, 'future supplementary owner attestation');
assert.equal(build({ ...mapping, primary: { ...mapping.primary, workspaceId: 'primary-b' } }), null, 'primary tenant mismatch');
assert.equal(build({ ...mapping, supplementary: { ...mapping.supplementary, workspaceId: 'target-b' } }), null, 'supplementary tenant mismatch');
assert.equal(build({ ...mapping, primary: { ...mapping.primary, ownerUserId: ' ' } }), null, 'missing primary owner');
assert.equal(build({ ...mapping, supplementary: { ...mapping.supplementary, consentEventId: '' } }), null, 'missing supplementary consent event');
assert.equal(build({ ...mapping, primary: { ...mapping.primary, evidenceSha256: 'not-a-digest' } }), null, 'invalid primary evidence digest');
assert.equal(build({ ...mapping, supplementary: { ...mapping.supplementary, evidenceSha256: 'C'.repeat(64) } }), null, 'digest must be normalized lowercase hex');
assert.equal(build({ ...mapping, reviewedByUserId: '' }), null, 'missing reviewer identity');
assert.equal(build(mapping, [signal], audience, ''), null, 'missing explicit primary workspace');
assert.equal(build(mapping, [signal], audience, 'primary-a', ''), null, 'missing explicit supplementary workspace');

const snapshot = build(mapping);
assert.ok(snapshot, 'valid dual-owner attestation and audience yield pure snapshot');
assert.equal(snapshot.audienceSegmentCode, 'seller');
assert.equal(snapshot.signals.length, 1);
assert.deepEqual(snapshot.unavailableMetrics, ['gross_margin', 'customer_count', 'repeat_purchase_rate'], 'missing KPI must not be invented');

const invalid: MarketingSignal[] = [
  { ...signal, value: Number.NaN },
  { ...signal, evidence: { ...evidence, sourceTable: '   ' } },
  { ...signal, evidence: { ...evidence, sourceRecordId: '   ' } },
  { ...signal, evidence: { ...evidence, sourceRecordId: '' } },
  { ...signal, evidence: { ...evidence, observedAt: 'invalid' } },
  { ...signal, periodStart: '2026-11-20', periodEnd: '2026-11-01' },
  { ...signal, unit: 'count' },
  { ...signal, metric: 'customer_count', value: 1.5, unit: 'count' },
  { ...signal, metric: 'gross_margin', value: 1.2, unit: 'ratio' },
  { ...signal, metric: 'repeat_purchase_rate', value: -0.1, unit: 'ratio' },
];
assert.equal(build(mapping, invalid)?.signals.length, 0, 'invalid evidence, values and units rejected');
assert.equal(build(mapping, null as unknown as MarketingSignal[]), null, 'malformed signals collection fails closed');
assert.equal(build(mapping, [null as unknown as MarketingSignal])?.signals.length, 0, 'null signal row is excluded without throwing');
assert.equal(build(mapping, [{ ...signal, evidence: null } as unknown as MarketingSignal])?.signals.length, 0, 'null evidence object is excluded without throwing');
console.log('PASS: CEO Back Office contract checks (dual owner evidence, expiry/revocation, audience, provenance)');
