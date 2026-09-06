import type { Database, Json } from '@/types/database.types';
import type { DashboardTruthState } from './dashboard-growth-loop';
import {
  CUSTOMER_SEGMENTS,
  type ActivationFunnelSnapshot,
  type CustomerSegment,
  type EvidenceMetric,
} from './consumer-behavior-financial-loop';

export const CONSUMER_FINANCIAL_OUTCOME_KEYS = {
  paidStarter: 'paid_starter_count',
  activated48h: 'activated_48h_count',
  firstValue7d: 'first_value_7d_count',
  w3Active: 'w3_active_count',
  corePaid: 'core_paid_count',
  renewed: 'renewed_count',
} as const;

export const CONSUMER_FINANCIAL_OUTCOME_KEY_LIST = Object.values(CONSUMER_FINANCIAL_OUTCOME_KEYS);

const DASHBOARD_TRUTH_STATES: readonly DashboardTruthState[] = [
  'MEASURED',
  'DERIVED',
  'ASSUMED',
  'PLACEHOLDER',
  'UNAVAILABLE',
];

type EvidenceRow = Database['public']['Tables']['marketing_evidence']['Row'];

type EvidenceValue = {
  cohort_id: string;
  segment: CustomerSegment;
  count?: number;
};

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTruthState(value: string): DashboardTruthState | null {
  return DASHBOARD_TRUTH_STATES.includes(value as DashboardTruthState)
    ? (value as DashboardTruthState)
    : null;
}

function parseEvidenceValue(row: EvidenceRow): EvidenceValue | null {
  if (!isRecord(row.value)) return null;

  const cohortId = row.value.cohort_id;
  const segment = row.value.segment;
  const count = row.value.count;
  const truthState = parseTruthState(row.truth_status);

  if (!truthState) return null;
  if (typeof cohortId !== 'string' || !cohortId.trim()) return null;
  if (typeof segment !== 'string' || !CUSTOMER_SEGMENTS.includes(segment as CustomerSegment)) return null;

  if (truthState === 'MEASURED' || truthState === 'DERIVED' || truthState === 'ASSUMED') {
    if (typeof count !== 'number' || !Number.isFinite(count) || count < 0) return null;
  }

  return {
    cohort_id: cohortId,
    segment: segment as CustomerSegment,
    ...(typeof count === 'number' ? { count } : {}),
  };
}

function sourceFromProvenance(provenance: Json): string | null {
  if (!isRecord(provenance)) return null;
  return typeof provenance.source === 'string' && provenance.source.trim() ? provenance.source : null;
}

function unavailableMetric(key: string): EvidenceMetric {
  return {
    key,
    value: null,
    truthState: 'UNAVAILABLE',
    evidenceIds: [],
    source: null,
    observedAt: null,
  };
}

function toMetric(key: string, row: EvidenceRow | undefined, cohortId: string): EvidenceMetric {
  if (!row) return unavailableMetric(key);

  const truthState = parseTruthState(row.truth_status);
  const parsed = parseEvidenceValue(row);
  if (!truthState || !parsed || parsed.cohort_id !== cohortId) return unavailableMetric(key);

  const canExposeValue = truthState === 'MEASURED' || truthState === 'DERIVED' || truthState === 'ASSUMED';

  return {
    key,
    value: canExposeValue ? parsed.count ?? null : null,
    truthState,
    evidenceIds: [row.id],
    source: sourceFromProvenance(row.provenance),
    observedAt: row.created_at,
  };
}

function latestRowsForCohort(rows: readonly EvidenceRow[], cohortId: string): Map<string, EvidenceRow> {
  const latest = new Map<string, EvidenceRow>();
  const allowedKeys = new Set<string>(CONSUMER_FINANCIAL_OUTCOME_KEY_LIST);

  for (const row of [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    if (!allowedKeys.has(row.outcome_key) || latest.has(row.outcome_key)) continue;
    const parsed = parseEvidenceValue(row);
    if (!parsed || parsed.cohort_id !== cohortId) continue;
    latest.set(row.outcome_key, row);
  }

  return latest;
}

function resolveSegment(rows: readonly EvidenceRow[], cohortId: string): CustomerSegment {
  const observed = new Set<CustomerSegment>();
  for (const row of rows) {
    const parsed = parseEvidenceValue(row);
    if (parsed?.cohort_id === cohortId) observed.add(parsed.segment);
  }

  if (observed.size === 0) return 'UNKNOWN';
  if (observed.size > 1) throw new Error(`CONFLICTING_COHORT_SEGMENT:${cohortId}`);
  return [...observed][0];
}

export function trustedEvidenceToActivationSnapshot(params: {
  workspaceId: string;
  cohortId: string;
  rows: readonly EvidenceRow[];
}): ActivationFunnelSnapshot {
  const latest = latestRowsForCohort(params.rows, params.cohortId);

  return {
    workspaceId: params.workspaceId,
    cohortId: params.cohortId,
    segment: resolveSegment(params.rows, params.cohortId),
    paidStarter: toMetric(
      CONSUMER_FINANCIAL_OUTCOME_KEYS.paidStarter,
      latest.get(CONSUMER_FINANCIAL_OUTCOME_KEYS.paidStarter),
      params.cohortId,
    ),
    activated48h: toMetric(
      CONSUMER_FINANCIAL_OUTCOME_KEYS.activated48h,
      latest.get(CONSUMER_FINANCIAL_OUTCOME_KEYS.activated48h),
      params.cohortId,
    ),
    firstValue7d: toMetric(
      CONSUMER_FINANCIAL_OUTCOME_KEYS.firstValue7d,
      latest.get(CONSUMER_FINANCIAL_OUTCOME_KEYS.firstValue7d),
      params.cohortId,
    ),
    w3Active: toMetric(
      CONSUMER_FINANCIAL_OUTCOME_KEYS.w3Active,
      latest.get(CONSUMER_FINANCIAL_OUTCOME_KEYS.w3Active),
      params.cohortId,
    ),
    corePaid: toMetric(
      CONSUMER_FINANCIAL_OUTCOME_KEYS.corePaid,
      latest.get(CONSUMER_FINANCIAL_OUTCOME_KEYS.corePaid),
      params.cohortId,
    ),
    renewed: toMetric(
      CONSUMER_FINANCIAL_OUTCOME_KEYS.renewed,
      latest.get(CONSUMER_FINANCIAL_OUTCOME_KEYS.renewed),
      params.cohortId,
    ),
  };
}
