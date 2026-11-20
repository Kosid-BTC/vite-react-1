import assert from 'node:assert/strict';
import { applyHumanDecision, proposeNextBestAction } from '../src/server/domain/decision-boundary';
import { createExperimentPlan, deriveLearning, recordTrustedOutcome } from '../src/server/domain/outcome-learning-boundary';
import type { Diagnosis } from '../src/server/domain/decision-boundary';
import type { Evidence } from '../src/server/domain/skill-contract';

const diagnosis: Diagnosis = {
  code: 'READY_FOR_ACTION',
  rationale: 'Trusted evidence supports a human-reviewed experiment proposal.',
  evidenceIds: ['evidence-source-1'],
};

const pending = proposeNextBestAction(diagnosis);
const pendingPlan = createExperimentPlan(pending);
assert.equal(pendingPlan.status, 'BLOCKED');
assert.equal(pendingPlan.executionMode, 'MANUAL_ONLY');
assert.equal(pendingPlan.executable, false);

const rejected = applyHumanDecision(pending, 'REJECTED');
const rejectedPlan = createExperimentPlan(rejected);
assert.equal(rejectedPlan.status, 'BLOCKED');
assert.equal(rejectedPlan.executable, false);

const approved = applyHumanDecision(pending, 'APPROVED');
const approvedPlan = createExperimentPlan(approved);
assert.equal(approvedPlan.status, 'MANUAL_REVIEW_READY');
assert.equal(approvedPlan.executionMode, 'MANUAL_ONLY');
assert.equal(approvedPlan.executable, false);

const outcomeEvidence: Evidence = {
  id: 'outcome-1',
  workspaceId: 'workspace-1',
  businessId: 'business-1',
  kind: 'outcome',
  outcomeKey: 'trial_activation_rate',
  truthStatus: 'MEASURED',
  value: { rate: 0.42 },
  provenance: {
    source: 'first-party-analytics',
    capturedAt: '2026-09-01T10:00:00.000Z',
  },
  idempotencyKey: 'outcome-1-key',
  createdBy: 'user-1',
};

const outcome = recordTrustedOutcome(approvedPlan, outcomeEvidence);
assert.equal(outcome.outcomeEvidenceId, 'outcome-1');
assert.deepEqual(outcome.sourceEvidenceIds, ['evidence-source-1']);

const learning = deriveLearning(outcome);
assert.equal(learning.status, 'LEARNING_READY');
assert.equal(learning.nextCycle.kind, 'NEXT_CYCLE_REVIEW_PROPOSAL');
assert.equal(learning.nextCycle.executable, false);
assert.deepEqual(learning.evidenceIds, ['evidence-source-1', 'outcome-1']);

const untrustedEvidence: Evidence = {
  ...outcomeEvidence,
  id: 'outcome-untrusted',
  idempotencyKey: 'outcome-untrusted-key',
  truthStatus: 'ASSUMED',
};
assert.throws(() => recordTrustedOutcome(approvedPlan, untrustedEvidence));

const wrongKindEvidence: Evidence = {
  ...outcomeEvidence,
  id: 'metric-1',
  idempotencyKey: 'metric-1-key',
  kind: 'metric',
};
assert.throws(() => recordTrustedOutcome(approvedPlan, wrongKindEvidence));
assert.throws(() => recordTrustedOutcome(pendingPlan, outcomeEvidence));

console.log('P1_4_OUTCOME_LEARNING_BOUNDARY: PASS');
console.log('AUTONOMOUS_EXECUTION: NO');
console.log('NEXT_CYCLE_AUTO_STARTED: NO');
