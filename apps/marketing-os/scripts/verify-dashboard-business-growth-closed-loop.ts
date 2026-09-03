import assert from 'node:assert/strict';
import {
  DASHBOARD_GROWTH_STAGES,
  DASHBOARD_TRUTH_STATES,
  createInsufficientEvidenceDashboardModel,
  hasValidExperimentLearningLink,
} from '../src/server/domain/dashboard-growth-loop';

const workspaceId = 'workspace-verifier';
const model = createInsufficientEvidenceDashboardModel(workspaceId);

assert.deepEqual(
  model.stages.map((item) => item.stage),
  DASHBOARD_GROWTH_STAGES,
  'dashboard hierarchy must preserve the canonical eight-stage order',
);

assert.equal(model.stages.length, 8, 'dashboard must expose exactly eight governed stages');
assert.equal(model.primaryNba.primary, true, 'exactly one canonical primary NBA is required');
assert.equal(model.primaryNba.humanApprovalRequired, true, 'NBA must require human approval');
assert.equal(model.primaryNba.executable, false, 'NBA must remain non-executable in this gate');
assert.equal(model.primaryNba.status, 'COLLECT_MORE_EVIDENCE');

for (const stage of model.stages) {
  assert.equal(stage.evidence.workspaceId, workspaceId, `${stage.stage}: workspace scope must be retained`);
  assert.ok(DASHBOARD_TRUTH_STATES.includes(stage.evidence.truthState), `${stage.stage}: invalid truth state`);
  assert.equal(stage.evidence.truthState, 'UNAVAILABLE', `${stage.stage}: absent evidence must fail closed`);
  assert.equal(stage.evidence.measurementHealth, 'INSUFFICIENT_EVIDENCE', `${stage.stage}: measurement health must fail closed`);
  assert.equal(stage.displayValue, null, `${stage.stage}: absent evidence must not render a fake numeric default`);
  assert.deepEqual(stage.evidence.evidenceIds, [], `${stage.stage}: evidence IDs must not be fabricated`);
  assert.equal(stage.evidence.source, null, `${stage.stage}: source must not be fabricated`);
  assert.equal(stage.evidence.observedAt, null, `${stage.stage}: observed time must not be fabricated`);
  assert.equal(stage.evidence.freshness, 'UNKNOWN', `${stage.stage}: freshness must be truthful when unknown`);
}

const forbiddenStrategicClaims = [
  /ROAS\s*[=:]\s*\d/i,
  /CAC\s*[=:]\s*\d/i,
  /LTV\s*[=:]\s*\d/i,
  /revenue\s*[=:]\s*\d/i,
  /winner\s*[=:]\s*true/i,
  /attribution\s*score\s*[=:]\s*\d/i,
];
const serialized = JSON.stringify(model);
for (const pattern of forbiddenStrategicClaims) {
  assert.equal(pattern.test(serialized), false, `insufficient-evidence model must not fabricate strategic output: ${pattern}`);
}

assert.equal(
  hasValidExperimentLearningLink(model),
  true,
  'experiment→learning must either use linked observed evidence or explicitly remain insufficient',
);

console.log(JSON.stringify({
  gate: 'DASHBOARD_UX_BUSINESS_GROWTH_CLOSED_LOOP',
  status: 'PASS',
  hierarchy: DASHBOARD_GROWTH_STAGES,
  truthStates: DASHBOARD_TRUTH_STATES,
  insufficientEvidence: 'PASS',
  exactlyOnePrimaryNba: 'PASS',
  humanApprovalRequired: true,
  executable: false,
  experimentLearningLink: 'PASS_FAIL_CLOSED',
  fabricatedMetrics: false,
}, null, 2));
