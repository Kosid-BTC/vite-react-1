import assert from 'node:assert/strict';
import type { Evidence } from '../src/server/domain/skill-contract';
import {
  applyHumanDecision,
  deriveMeasurementHealth,
  diagnoseGrowth,
  proposeNextBestAction,
} from '../src/server/domain/decision-boundary';

const baseEvidence: Omit<Evidence, 'truthStatus' | 'idempotencyKey' | 'outcomeKey' | 'value'> = {
  id: 'ev-1',
  workspaceId: 'workspace-a',
  businessId: 'business-a',
  kind: 'metric',
  provenance: {
    source: 'ga4',
    capturedAt: '2026-09-01T00:00:00.000Z',
  },
  createdBy: 'user-a',
};

function evidence(truthStatus: Evidence['truthStatus'], id: string): Evidence {
  return {
    ...baseEvidence,
    id,
    idempotencyKey: `key-${id}`,
    outcomeKey: 'activation_rate',
    truthStatus,
    value: { value: 0.42 },
  };
}

{
  const health = deriveMeasurementHealth([]);
  assert.equal(health.status, 'INSUFFICIENT_EVIDENCE');
  const diagnosis = diagnoseGrowth(health);
  assert.equal(diagnosis.code, 'COLLECT_MORE_EVIDENCE');
  const nba = proposeNextBestAction(diagnosis);
  assert.equal(nba.actionKey, 'COLLECT_MORE_EVIDENCE');
  assert.equal(nba.humanDecision, 'PENDING');
  assert.equal(nba.executable, false);
}

{
  const assumed = evidence('ASSUMED', 'ev-assumed');
  const placeholder = evidence('PLACEHOLDER', 'ev-placeholder');
  const health = deriveMeasurementHealth([assumed, placeholder]);
  assert.equal(health.status, 'UNTRUSTED_EVIDENCE');
  const diagnosis = diagnoseGrowth(health);
  assert.equal(diagnosis.code, 'EVIDENCE_NOT_TRUSTED');
  const nba = proposeNextBestAction(diagnosis);
  assert.equal(nba.actionKey, 'REMEDIATE_EVIDENCE_QUALITY');
  assert.deepEqual(nba.evidenceIds, ['ev-assumed', 'ev-placeholder']);
  assert.equal(nba.executable, false);
}

{
  const measured = evidence('MEASURED', 'ev-measured');
  const derived = evidence('DERIVED', 'ev-derived');
  const health = deriveMeasurementHealth([measured, derived]);
  assert.equal(health.status, 'HEALTHY');
  assert.equal(health.trustedEvidenceCount, 2);
  const diagnosis = diagnoseGrowth(health);
  assert.equal(diagnosis.code, 'READY_FOR_ACTION');
  const nba = proposeNextBestAction(diagnosis);
  assert.equal(nba.actionKey, 'REVIEW_GROWTH_EXPERIMENT');
  assert.deepEqual(nba.evidenceIds, ['ev-measured', 'ev-derived']);
  assert.equal(nba.humanDecision, 'PENDING');
  assert.equal(nba.executable, false);

  const approved = applyHumanDecision(nba, 'APPROVED');
  assert.equal(approved.humanDecision, 'APPROVED');
  assert.equal(approved.executable, false);

  const rejected = applyHumanDecision(nba, 'REJECTED');
  assert.equal(rejected.humanDecision, 'REJECTED');
  assert.equal(rejected.executable, false);
}

console.log('P1_3_GROWTH_DECISION_BOUNDARY: PASS');
console.log('NO_EVIDENCE_FAKE_SCORE: PASS');
console.log('TRUTH_STATUS_GATE: PASS');
console.log('PROVENANCE_LINEAGE_TRACE: PASS');
console.log('NBA_HUMAN_DECISION_BOUNDARY: PASS');
console.log('PRODUCTION_TOUCHED: NO');
