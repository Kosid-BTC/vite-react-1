import assert from 'node:assert/strict';
import { buildConsumerBehaviorFinancialLoop } from '../src/server/domain/consumer-behavior-financial-loop';
import {
  CONSUMER_FINANCIAL_OUTCOME_KEYS,
  trustedEvidenceToActivationSnapshot,
} from '../src/server/domain/consumer-financial-evidence';
import type { Database, Json } from '../src/types/database.types';

type EvidenceRow = Database['public']['Tables']['marketing_evidence']['Row'];

let sequence = 0;
const row = (params: {
  key: string;
  cohortId: string;
  segment?: 'SOLO_STARTER' | 'SME_TEAM' | 'UNKNOWN';
  count?: number;
  truth?: EvidenceRow['truth_status'];
  createdAt?: string;
  valueOverride?: Json;
}): EvidenceRow => {
  sequence += 1;
  return {
    id: `ev-${sequence}`,
    workspace_id: 'workspace-1',
    business_id: 'business-1',
    campaign_id: null,
    content_item_id: null,
    evidence_kind: 'metric',
    outcome_key: params.key,
    truth_status: params.truth ?? 'MEASURED',
    value:
      params.valueOverride ??
      ({
        cohort_id: params.cohortId,
        segment: params.segment ?? 'SOLO_STARTER',
        ...(params.count === undefined ? {} : { count: params.count }),
      } satisfies Json),
    provenance: { source: 'first-party-activation-events' },
    idempotency_key: `idem-${sequence}`,
    created_by: 'user-1',
    created_at: params.createdAt ?? `2026-09-06T00:00:${String(sequence).padStart(2, '0')}.000Z`,
    updated_at: params.createdAt ?? `2026-09-06T00:00:${String(sequence).padStart(2, '0')}.000Z`,
  };
};

const cohortRows: EvidenceRow[] = [
  row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.paidStarter, cohortId: '2026-09', count: 100 }),
  row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.activated48h, cohortId: '2026-09', count: 60 }),
  row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.firstValue7d, cohortId: '2026-09', count: 30 }),
  row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.w3Active, cohortId: '2026-09', count: 24 }),
  row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.corePaid, cohortId: '2026-09', count: 12 }),
  row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.renewed, cohortId: '2026-09', count: 8 }),
  row({
    key: CONSUMER_FINANCIAL_OUTCOME_KEYS.activated48h,
    cohortId: '2026-09',
    count: 65,
    createdAt: '2026-09-06T01:00:00.000Z',
  }),
  row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.paidStarter, cohortId: '2026-08', count: 999 }),
];

const snapshot = trustedEvidenceToActivationSnapshot({
  workspaceId: 'workspace-1',
  cohortId: '2026-09',
  rows: cohortRows,
});
assert.equal(snapshot.segment, 'SOLO_STARTER');
assert.equal(snapshot.paidStarter.value, 100);
assert.equal(snapshot.activated48h.value, 65, 'latest cohort evidence must win');
assert.equal(snapshot.firstValue7d.value, 30);
assert.equal(snapshot.paidStarter.truthState, 'MEASURED');
assert.equal(snapshot.paidStarter.source, 'first-party-activation-events');

const model = buildConsumerBehaviorFinancialLoop(snapshot);
assert.equal(model.rates.ACTIVATION_RATE_48H.value, 0.65);
assert.equal(model.rates.VERIFIED_FIRST_BUSINESS_OUTCOME_RATE.value, 0.3);
assert.equal(model.rates.STARTER_TO_CORE_CONVERSION.value, 0.12);
assert.equal(model.primaryNba.primary, true);
assert.equal(model.primaryNba.humanApprovalRequired, true);
assert.equal(model.primaryNba.executable, false);
assert.equal(model.primaryNba.externalMutation, false);

const assumed = trustedEvidenceToActivationSnapshot({
  workspaceId: 'workspace-1',
  cohortId: 'assumed',
  rows: [
    row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.paidStarter, cohortId: 'assumed', count: 100 }),
    row({
      key: CONSUMER_FINANCIAL_OUTCOME_KEYS.firstValue7d,
      cohortId: 'assumed',
      count: 40,
      truth: 'ASSUMED',
    }),
  ],
});
assert.equal(assumed.firstValue7d.truthState, 'ASSUMED');
assert.equal(buildConsumerBehaviorFinancialLoop(assumed).rates.VERIFIED_FIRST_BUSINESS_OUTCOME_RATE.truthState, 'ASSUMED');
assert.equal(
  buildConsumerBehaviorFinancialLoop(assumed).primaryNba.status,
  'COLLECT_EVIDENCE',
  'assumptions must never masquerade as observed customer behavior',
);

const placeholder = trustedEvidenceToActivationSnapshot({
  workspaceId: 'workspace-1',
  cohortId: 'placeholder',
  rows: [
    row({
      key: CONSUMER_FINANCIAL_OUTCOME_KEYS.paidStarter,
      cohortId: 'placeholder',
      count: 600,
      truth: 'PLACEHOLDER',
    }),
  ],
});
assert.equal(placeholder.paidStarter.truthState, 'PLACEHOLDER');
assert.equal(placeholder.paidStarter.value, null, 'placeholder figures must fail closed instead of displaying as actual');

const malformed = trustedEvidenceToActivationSnapshot({
  workspaceId: 'workspace-1',
  cohortId: 'malformed',
  rows: [
    row({
      key: CONSUMER_FINANCIAL_OUTCOME_KEYS.paidStarter,
      cohortId: 'malformed',
      valueOverride: { cohort_id: 'malformed', segment: 'SOLO_STARTER', count: '100' },
    }),
  ],
});
assert.equal(malformed.paidStarter.truthState, 'UNAVAILABLE');
assert.equal(malformed.paidStarter.value, null);

assert.throws(
  () =>
    trustedEvidenceToActivationSnapshot({
      workspaceId: 'workspace-1',
      cohortId: 'conflict',
      rows: [
        row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.paidStarter, cohortId: 'conflict', count: 10, segment: 'SOLO_STARTER' }),
        row({ key: CONSUMER_FINANCIAL_OUTCOME_KEYS.activated48h, cohortId: 'conflict', count: 5, segment: 'SME_TEAM' }),
      ],
    }),
  /CONFLICTING_COHORT_SEGMENT/,
);

console.log(
  JSON.stringify(
    {
      gate: 'CONSUMER_FINANCIAL_TRUSTED_EVIDENCE_ADAPTER',
      status: 'PASS',
      latestEvidenceWins: true,
      cohortIsolation: true,
      assumptionsRemainAssumptions: true,
      placeholdersFailClosed: true,
      malformedEvidenceFailsClosed: true,
      conflictingSegmentFailsClosed: true,
      primaryNba: 'ONE_ONLY',
      humanApprovalRequired: true,
      executable: false,
    },
    null,
    2,
  ),
);
