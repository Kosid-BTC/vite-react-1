// Development-only offline regression. No credentials, database access or live tenant claims.
import assert from 'node:assert/strict';
import {
  buildMarketingIntelligenceSnapshot,
  isMappingAttested,
  type MappingAttestation,
} from '../src/lib/marketing-intelligence/ceo-backoffice-contract';

const now = new Date('2026-11-19T00:00:00.000Z');
const primary = 'tenant-a-selected-workspace';
const secondary = 'tenant-a-backoffice-workspace';
const mapping: MappingAttestation = {
  primary: {
    projectRef: 'bjozpwdtqbpwcxnqguka',
    workspaceId: primary,
    ownerUserId: 'tenant-a-primary-owner',
    consentEventId: 'primary-consent-a',
    evidenceSha256: 'a'.repeat(64),
    verifiedAt: '2026-11-18T00:00:00.000Z',
  },
  supplementary: {
    projectRef: 'waigsnxhrlwtiotspaim',
    workspaceId: secondary,
    ownerUserId: 'tenant-a-backoffice-owner',
    consentEventId: 'supplementary-consent-a',
    evidenceSha256: 'b'.repeat(64),
    verifiedAt: '2026-11-18T01:00:00.000Z',
  },
  reviewedByUserId: 'reviewer-user-a',
  reviewedBy: 'independent-security-reviewer',
  expiresAt: '2026-11-20T00:00:00.000Z',
  revokedAt: null,
  revocationReason: null,
};
const audience = {
  segmentCode: 'seller' as const,
  onboardingStage: 'post_onboarding' as const,
  hasVerifiedBusinessSignals: true,
};
const build = (overrides: Partial<Parameters<typeof buildMarketingIntelligenceSnapshot>[0]> = {}) =>
  buildMarketingIntelligenceSnapshot({
    primaryWorkspaceId: primary,
    supplementaryWorkspaceId: secondary,
    mapping,
    audience,
    now,
    signals: [],
    ...overrides,
  });

// MAP-01: neither the first available workspace nor an empty selection may be inferred.
assert.equal(build({ primaryWorkspaceId: '' }), null, 'missing explicit primary workspace must deny');
assert.equal(build({ supplementaryWorkspaceId: '' }), null, 'missing explicit supplementary workspace must deny');
assert.equal(build({ primaryWorkspaceId: 'first-workspace-in-list' }), null, 'first workspace fallback must deny');
assert.equal(build({ supplementaryWorkspaceId: 'first-backoffice-workspace-in-list' }), null, 'first supplementary workspace fallback must deny');

// MAP-02 / MAP-04: both independent owner proofs are required; malformed evidence must deny.
assert.equal(build({ mapping: { ...mapping, supplementary: { ...mapping.supplementary, ownerUserId: '' } } }), null, 'missing supplementary owner proof must deny');
assert.equal(build({ mapping: { ...mapping, primary: { ...mapping.primary, consentEventId: '' } } }), null, 'missing primary consent event must deny');
assert.equal(build({ mapping: { ...mapping, primary: { ...mapping.primary, evidenceSha256: 'forged' } } }), null, 'forged primary evidence digest must deny');
assert.equal(build({ mapping: { ...mapping, supplementary: { ...mapping.supplementary, evidenceSha256: 'f'.repeat(63) } } }), null, 'wrong digest length must deny');
assert.equal(build({ mapping: { ...mapping, reviewedByUserId: '' } }), null, 'missing reviewer identity must deny');

// MAP-05 / MAP-06 / MAP-07: expiration, revocation, and cross-tenant mismatch.
assert.equal(build({ now: new Date(mapping.expiresAt) }), null, 'expiry boundary must deny');
assert.equal(build({ mapping: { ...mapping, revokedAt: '2026-11-18T12:00:00.000Z', revocationReason: 'owner revoked' } }), null, 'revocation must deny');
assert.equal(build({ mapping: { ...mapping, revocationReason: 'missing timestamp' } }), null, 'inconsistent revocation evidence must deny');
assert.equal(build({ primaryWorkspaceId: 'tenant-b-workspace' }), null, 'tenant B primary must deny');
assert.equal(build({ supplementaryWorkspaceId: 'tenant-b-backoffice' }), null, 'tenant B supplementary must deny');
assert.equal(build({ mapping: null }), null, 'missing mapping must deny');
assert.equal(build({ mapping: { ...mapping, primary: { ...mapping.primary, verifiedAt: '2026-11-20T00:00:01.000Z' } } }), null, 'future primary owner attestation must deny');
assert.equal(build({ mapping: { ...mapping, supplementary: { ...mapping.supplementary, verifiedAt: '2026-11-20T00:00:01.000Z' } } }), null, 'future supplementary owner attestation must deny');
assert.equal(build({ mapping: { ...mapping, expiresAt: mapping.primary.verifiedAt } }), null, 'expiry before both owner proofs must deny');
assert.equal(build({ mapping: { ...mapping, primary: { ...mapping.primary, projectRef: 'waigsnxhrlwtiotspaim' } } as unknown as MappingAttestation }), null, 'wrong primary Auth project must deny');
assert.equal(build({ mapping: { ...mapping, supplementary: { ...mapping.supplementary, projectRef: 'bjozpwdtqbpwcxnqguka' } } as unknown as MappingAttestation }), null, 'wrong supplementary Auth project must deny');

assert.equal(isMappingAttested(mapping, primary, secondary, now), true, 'valid explicit dual-owner mapping passes offline contract only');
assert.ok(build(), 'valid explicit mapping yields a pure offline snapshot');
console.log('PASS: offline explicit-workspace and dual-owner negative contract checks (NOT authenticated tenant isolation)');
