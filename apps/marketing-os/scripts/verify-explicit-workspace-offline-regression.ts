// Development-only offline regression. No credentials, database access or live tenant claims.
import assert from 'node:assert/strict';
import { buildMarketingIntelligenceSnapshot, isMappingAttested } from '../src/lib/marketing-intelligence/ceo-backoffice-contract';

const now = new Date('2026-11-19T00:00:00.000Z');
const primary = 'tenant-a-selected-workspace';
const secondary = 'tenant-a-backoffice-workspace';
const mapping = { primaryWorkspaceId: primary, supplementaryWorkspaceId: secondary,
  verifiedBy: 'two-independent-owner-consent-events-verified-server-side',
  verifiedAt: '2026-11-18T00:00:00.000Z', expiresAt: '2026-11-20T00:00:00.000Z', status: 'approved' as const };
const audience = { segmentCode: 'seller' as const, onboardingStage: 'post_onboarding' as const, hasVerifiedBusinessSignals: true };
const build = (overrides: Partial<Parameters<typeof buildMarketingIntelligenceSnapshot>[0]> = {}) =>
  buildMarketingIntelligenceSnapshot({ primaryWorkspaceId: primary, supplementaryWorkspaceId: secondary, mapping, audience, now, signals: [], ...overrides });

// MAP-01: neither the first available workspace nor an empty selection may be inferred.
assert.equal(build({ primaryWorkspaceId: '' }), null, 'missing explicit primary workspace must deny');
assert.equal(build({ supplementaryWorkspaceId: '' }), null, 'missing explicit supplementary workspace must deny');
assert.equal(build({ primaryWorkspaceId: 'first-workspace-in-list' }), null, 'first workspace fallback must deny');
assert.equal(build({ supplementaryWorkspaceId: 'first-backoffice-workspace-in-list' }), null, 'first supplementary workspace fallback must deny');
// MAP-05 / MAP-06 / MAP-07: expiration, revocation, and cross-tenant mismatch.
assert.equal(build({ now: new Date(mapping.expiresAt) }), null, 'expiry boundary must deny');
assert.equal(build({ mapping: { ...mapping, status: 'revoked' } }), null, 'revocation must deny');
assert.equal(build({ primaryWorkspaceId: 'tenant-b-workspace' }), null, 'tenant B must deny');
assert.equal(build({ supplementaryWorkspaceId: 'tenant-b-backoffice' }), null, 'tenant B supplementary must deny');
assert.equal(build({ mapping: null }), null, 'missing mapping must deny');
assert.equal(build({ mapping: { ...mapping, verifiedAt: '2026-11-20T00:00:01.000Z' } }), null, 'future owner attestation must deny');
assert.equal(build({ mapping: { ...mapping, expiresAt: mapping.verifiedAt } }), null, 'zero-lifetime attestation must deny');
assert.equal(build({ mapping: { ...mapping, verifiedAt: 'not-a-date' } }), null, 'invalid attestation timestamp must deny');
assert.equal(build({ mapping: { ...mapping, status: 'revoked', verifiedBy: 'owner' } }), null, 'revoked mapping must remain denied even with owner evidence');
assert.equal(isMappingAttested({ ...mapping, verifiedBy: ' ' }, primary, secondary, now), false, 'blank attestor must deny');
assert.ok(build(), 'valid explicitly selected mapping passes offline contract only');
console.log('PASS: offline explicit-workspace negative contract checks (NOT authenticated tenant isolation)');
