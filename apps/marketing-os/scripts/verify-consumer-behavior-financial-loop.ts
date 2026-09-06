import assert from 'node:assert/strict';
import {
  buildConsumerBehaviorFinancialLoop,
  type ActivationFunnelSnapshot,
  type EvidenceMetric,
  type FinancialScalePolicy,
} from '../src/server/domain/consumer-behavior-financial-loop';

const measured = (key: string, value: number, evidenceId: string): EvidenceMetric => ({
  key,
  value,
  truthState: 'MEASURED',
  evidenceIds: [evidenceId],
  source: 'first-party-cohort',
  observedAt: '2026-09-06T00:00:00.000Z',
});

const unavailable = (key: string): EvidenceMetric => ({
  key,
  value: null,
  truthState: 'UNAVAILABLE',
  evidenceIds: [],
  source: null,
  observedAt: null,
});

const emptySnapshot: ActivationFunnelSnapshot = {
  workspaceId: 'workspace-1',
  cohortId: 'cohort-empty',
  segment: 'SOLO_STARTER',
  paidStarter: unavailable('paid_starter'),
  activated48h: unavailable('activated_48h'),
  firstValue7d: unavailable('first_value_7d'),
  w3Active: unavailable('w3_active'),
  corePaid: unavailable('core_paid'),
  renewed: unavailable('renewed'),
};

const emptyModel = buildConsumerBehaviorFinancialLoop(emptySnapshot);
assert.equal(emptyModel.rates.ACTIVATION_RATE_48H.truthState, 'UNAVAILABLE');
assert.equal(emptyModel.rates.VERIFIED_FIRST_BUSINESS_OUTCOME_RATE.value, null);
assert.equal(emptyModel.primaryNba.primary, true);
assert.equal(emptyModel.primaryNba.status, 'COLLECT_EVIDENCE');
assert.equal(emptyModel.primaryNba.humanApprovalRequired, true);
assert.equal(emptyModel.primaryNba.executable, false);
assert.equal(emptyModel.primaryNba.externalMutation, false);
assert.equal(emptyModel.financialScaleGate.state, 'HUMAN_POLICY_REQUIRED');
assert.equal(emptyModel.financialScaleGate.executable, false);

const observedSnapshot: ActivationFunnelSnapshot = {
  workspaceId: 'workspace-1',
  cohortId: 'cohort-2026-09',
  segment: 'SME_TEAM',
  paidStarter: measured('paid_starter', 100, 'ev-paid'),
  activated48h: measured('activated_48h', 70, 'ev-activated'),
  firstValue7d: measured('first_value_7d', 35, 'ev-first-value'),
  w3Active: measured('w3_active', 28, 'ev-w3'),
  corePaid: measured('core_paid', 14, 'ev-core'),
  renewed: measured('renewed', 10, 'ev-renewed'),
};

const assumedFloor: EvidenceMetric = {
  key: 'minimum_starter_to_core_rate',
  value: 0.2,
  truthState: 'ASSUMED',
  evidenceIds: ['policy-finance-model-2026-08-24'],
  source: 'human-approved-finance-policy',
  observedAt: '2026-09-06T00:00:00.000Z',
};
const holdPolicy: FinancialScalePolicy = {
  approvedByHuman: true,
  minimumStarterToCoreRate: assumedFloor,
};

const observedModel = buildConsumerBehaviorFinancialLoop(observedSnapshot, holdPolicy);
assert.equal(observedModel.rates.ACTIVATION_RATE_48H.value, 0.7);
assert.equal(observedModel.rates.ACTIVATION_RATE_48H.truthState, 'DERIVED');
assert.equal(observedModel.rates.VERIFIED_FIRST_BUSINESS_OUTCOME_RATE.value, 0.35);
assert.equal(observedModel.rates.STARTER_TO_CORE_CONVERSION.value, 0.14);
assert.equal(observedModel.rates.CORE_RENEWAL_RATE.value, 10 / 14);
assert.equal(observedModel.largestObservedLeak?.from, 'ACTIVATED_48H');
assert.equal(observedModel.largestObservedLeak?.to, 'FIRST_VALUE_7D');
assert.equal(observedModel.largestObservedLeak?.lossRate, 0.5);
assert.equal(observedModel.primaryNba.status, 'REVIEW_OBSERVED_LEAK');
assert.equal(observedModel.primaryNba.primary, true);
assert.equal(observedModel.primaryNba.humanApprovalRequired, true);
assert.equal(observedModel.primaryNba.executable, false);
assert.equal(observedModel.primaryNba.externalMutation, false);
assert.equal(observedModel.financialScaleGate.state, 'HOLD_ACQUISITION');
assert.equal(observedModel.financialScaleGate.truthState, 'ASSUMED');
assert.equal(observedModel.financialScaleGate.humanApprovalRequired, true);
assert.equal(observedModel.financialScaleGate.executable, false);

const reviewPolicy: FinancialScalePolicy = {
  approvedByHuman: true,
  minimumStarterToCoreRate: {
    ...assumedFloor,
    value: 0.1,
    evidenceIds: ['policy-approved-minimum-10pct'],
  },
};
const reviewModel = buildConsumerBehaviorFinancialLoop(observedSnapshot, reviewPolicy);
assert.equal(reviewModel.financialScaleGate.state, 'ELIGIBLE_FOR_HUMAN_SCALE_REVIEW');
assert.equal(reviewModel.financialScaleGate.executable, false, 'scale eligibility must never mutate spend automatically');

const assumedSnapshot: ActivationFunnelSnapshot = {
  ...observedSnapshot,
  cohortId: 'cohort-assumed',
  firstValue7d: {
    key: 'first_value_7d',
    value: 60,
    truthState: 'ASSUMED',
    evidenceIds: ['assumption-only'],
    source: 'example-model',
    observedAt: null,
  },
  w3Active: unavailable('w3_active'),
  corePaid: unavailable('core_paid'),
  renewed: unavailable('renewed'),
};
const assumedModel = buildConsumerBehaviorFinancialLoop(assumedSnapshot);
assert.equal(assumedModel.rates.VERIFIED_FIRST_BUSINESS_OUTCOME_RATE.truthState, 'ASSUMED');
assert.equal(
  assumedModel.primaryNba.status,
  'COLLECT_EVIDENCE',
  'assumed First Value must not be promoted into an observed strategic recommendation',
);

assert.throws(
  () =>
    buildConsumerBehaviorFinancialLoop({
      ...observedSnapshot,
      cohortId: 'invalid-funnel',
      activated48h: measured('activated_48h', 110, 'bad-stage'),
    }),
  /FUNNEL_RATIO_EXCEEDS_ONE|FUNNEL_STAGE_INCREASE/,
  'increasing funnel counts inside one cohort must fail closed',
);

const serialized = JSON.stringify({ emptyModel, observedModel, assumedModel });
for (const forbidden of [/guarantee/i, /auto.?publish/i, /auto.?spend/i, /execute.?true/i]) {
  assert.equal(forbidden.test(serialized), false, `consumer/finance loop must not introduce unsafe promise or mutation: ${forbidden}`);
}

console.log(
  JSON.stringify(
    {
      gate: 'CONSUMER_BEHAVIOR_FINANCIAL_LOOP',
      status: 'PASS',
      segmentation: ['SOLO_STARTER', 'SME_TEAM', 'UNKNOWN'],
      verifiedFirstBusinessOutcomeRate: 'DERIVED_ONLY_FROM_EVIDENCE',
      assumedInputsRemainAssumed: true,
      exactlyOnePrimaryNba: true,
      humanApprovalRequired: true,
      executable: false,
      financialScaleGate: 'HUMAN_GOVERNED',
      fabricatedMetrics: false,
    },
    null,
    2,
  ),
);
