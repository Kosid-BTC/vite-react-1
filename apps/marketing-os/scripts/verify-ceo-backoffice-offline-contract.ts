// Offline contract regression: no credentials, DB connection, or tenant data required.
import assert from 'node:assert/strict';
import { isMappingAttested, buildMarketingIntelligenceSnapshot } from '../src/lib/marketing-intelligence/ceo-backoffice-contract';

const now = new Date('2026-11-16T00:00:00.000Z');
const primaryWorkspaceId = 'primary-tenant-a';
const supplementaryWorkspaceId = 'backoffice-tenant-a';
const approved = {
  primaryWorkspaceId, supplementaryWorkspaceId,
  verifiedBy: 'independent-owner-proof',
  verifiedAt: '2026-11-15T00:00:00.000Z',
  expiresAt: '2026-11-17T00:00:00.000Z',
  status: 'approved' as const,
};
const args = { primaryWorkspaceId, supplementaryWorkspaceId, now, mapping: approved };
assert.equal(isMappingAttested(null, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, status: 'revoked' }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, expiresAt: now.toISOString() }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested({ ...approved, verifiedAt: '2026-11-17T00:00:00.000Z' }, primaryWorkspaceId, supplementaryWorkspaceId, now), false);
assert.equal(isMappingAttested(approved, primaryWorkspaceId, 'backoffice-tenant-b', now), false);
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
assert.equal(snapshot.signals.length, 1);
assert.equal(snapshot.signals[0].value, 500);
assert.deepEqual(snapshot.unavailableMetrics, ['gross_margin', 'customer_count', 'repeat_purchase_rate']);
assert.equal(snapshot.primaryWorkspaceId, primaryWorkspaceId);
assert.equal(snapshot.supplementaryWorkspaceId, supplementaryWorkspaceId);
console.log('PASS: offline CEO Back Office contract regression (no live access)');
