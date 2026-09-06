import type { DashboardTruthState } from './dashboard-growth-loop';

export const CUSTOMER_SEGMENTS = ['SOLO_STARTER', 'SME_TEAM', 'UNKNOWN'] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

export const ACTIVATION_FUNNEL_STAGES = [
  'PAID_STARTER',
  'ACTIVATED_48H',
  'FIRST_VALUE_7D',
  'W3_ACTIVE',
  'CORE_PAID',
  'RENEWED',
] as const;
export type ActivationFunnelStage = (typeof ACTIVATION_FUNNEL_STAGES)[number];

export interface EvidenceMetric {
  key: string;
  value: number | null;
  truthState: DashboardTruthState;
  evidenceIds: readonly string[];
  source: string | null;
  observedAt: string | null;
}

export interface ActivationFunnelSnapshot {
  workspaceId: string;
  cohortId: string;
  segment: CustomerSegment;
  paidStarter: EvidenceMetric;
  activated48h: EvidenceMetric;
  firstValue7d: EvidenceMetric;
  w3Active: EvidenceMetric;
  corePaid: EvidenceMetric;
  renewed: EvidenceMetric;
}

export type ActivationRateKey =
  | 'ACTIVATION_RATE_48H'
  | 'VERIFIED_FIRST_BUSINESS_OUTCOME_RATE'
  | 'W3_ACTIVE_RATE'
  | 'STARTER_TO_CORE_CONVERSION'
  | 'CORE_RENEWAL_RATE';

export interface ActivationLeak {
  from: ActivationFunnelStage;
  to: ActivationFunnelStage;
  lossRate: number;
  evidenceIds: readonly string[];
}

export interface ActivationPrimaryNba {
  id: string;
  title: string;
  summary: string;
  primary: true;
  humanApprovalRequired: true;
  executable: false;
  externalMutation: false;
  evidenceIds: readonly string[];
  status: 'COLLECT_EVIDENCE' | 'REVIEW_OBSERVED_LEAK';
}

export interface FinancialScalePolicy {
  approvedByHuman: boolean;
  minimumStarterToCoreRate: EvidenceMetric;
}

export interface FinancialScaleGate {
  state:
    | 'HUMAN_POLICY_REQUIRED'
    | 'INSUFFICIENT_EVIDENCE'
    | 'HOLD_ACQUISITION'
    | 'ELIGIBLE_FOR_HUMAN_SCALE_REVIEW';
  truthState: DashboardTruthState;
  summary: string;
  humanApprovalRequired: true;
  executable: false;
  evidenceIds: readonly string[];
}

export interface ConsumerBehaviorFinancialLoopModel {
  workspaceId: string;
  cohortId: string;
  segment: CustomerSegment;
  rates: Record<ActivationRateKey, EvidenceMetric>;
  largestObservedLeak: ActivationLeak | null;
  primaryNba: ActivationPrimaryNba;
  financialScaleGate: FinancialScaleGate;
}

const COMPUTABLE_STATES: readonly DashboardTruthState[] = ['MEASURED', 'DERIVED', 'ASSUMED'];
const OBSERVED_STATES: readonly DashboardTruthState[] = ['MEASURED', 'DERIVED'];

function uniqueEvidenceIds(...lists: readonly (readonly string[])[]): string[] {
  return [...new Set(lists.flat())];
}

function assertMetric(metric: EvidenceMetric): void {
  if (metric.truthState === 'UNAVAILABLE' && metric.value !== null) {
    throw new Error(`UNAVAILABLE_METRIC_HAS_VALUE:${metric.key}`);
  }

  if (COMPUTABLE_STATES.includes(metric.truthState)) {
    if (metric.value === null || !Number.isFinite(metric.value) || metric.value < 0) {
      throw new Error(`INVALID_COMPUTABLE_METRIC:${metric.key}`);
    }
  }
}

function isComputable(metric: EvidenceMetric): metric is EvidenceMetric & { value: number } {
  assertMetric(metric);
  return metric.value !== null && COMPUTABLE_STATES.includes(metric.truthState);
}

function isObserved(metric: EvidenceMetric): metric is EvidenceMetric & { value: number } {
  assertMetric(metric);
  return metric.value !== null && OBSERVED_STATES.includes(metric.truthState);
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

function deriveRatio(
  key: ActivationRateKey,
  numerator: EvidenceMetric,
  denominator: EvidenceMetric,
): EvidenceMetric {
  if (!isComputable(numerator) || !isComputable(denominator) || denominator.value <= 0) {
    return unavailableMetric(key);
  }

  if (numerator.value > denominator.value) {
    throw new Error(`FUNNEL_RATIO_EXCEEDS_ONE:${key}`);
  }

  const containsAssumption = numerator.truthState === 'ASSUMED' || denominator.truthState === 'ASSUMED';

  return {
    key,
    value: numerator.value / denominator.value,
    truthState: containsAssumption ? 'ASSUMED' : 'DERIVED',
    evidenceIds: uniqueEvidenceIds(numerator.evidenceIds, denominator.evidenceIds),
    source: `derived:${numerator.key}/${denominator.key}`,
    observedAt: numerator.observedAt ?? denominator.observedAt,
  };
}

function findLargestObservedLeak(snapshot: ActivationFunnelSnapshot): ActivationLeak | null {
  const ordered: readonly [ActivationFunnelStage, EvidenceMetric][] = [
    ['PAID_STARTER', snapshot.paidStarter],
    ['ACTIVATED_48H', snapshot.activated48h],
    ['FIRST_VALUE_7D', snapshot.firstValue7d],
    ['W3_ACTIVE', snapshot.w3Active],
    ['CORE_PAID', snapshot.corePaid],
    ['RENEWED', snapshot.renewed],
  ];

  let largest: ActivationLeak | null = null;

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const [fromStage, fromMetric] = ordered[index];
    const [toStage, toMetric] = ordered[index + 1];
    if (!isObserved(fromMetric) || !isObserved(toMetric) || fromMetric.value <= 0) continue;
    if (toMetric.value > fromMetric.value) {
      throw new Error(`FUNNEL_STAGE_INCREASE:${fromStage}->${toStage}`);
    }

    const lossRate = (fromMetric.value - toMetric.value) / fromMetric.value;
    const candidate: ActivationLeak = {
      from: fromStage,
      to: toStage,
      lossRate,
      evidenceIds: uniqueEvidenceIds(fromMetric.evidenceIds, toMetric.evidenceIds),
    };

    if (!largest || candidate.lossRate > largest.lossRate) largest = candidate;
  }

  return largest;
}

function buildPrimaryNba(
  firstOutcomeRate: EvidenceMetric,
  largestObservedLeak: ActivationLeak | null,
): ActivationPrimaryNba {
  if (firstOutcomeRate.truthState !== 'DERIVED' || firstOutcomeRate.value === null || !largestObservedLeak) {
    return {
      id: 'collect-activation-first-value-evidence',
      title: 'เก็บหลักฐาน Activation และ First Value ให้ครบ',
      summary: 'ยังไม่มี observed cohort evidence เพียงพอสำหรับชี้จุดรั่ว จึงยังไม่ควรเพิ่มงบ Acquisition',
      primary: true,
      humanApprovalRequired: true,
      executable: false,
      externalMutation: false,
      evidenceIds: [],
      status: 'COLLECT_EVIDENCE',
    };
  }

  const lossPercent = Math.round(largestObservedLeak.lossRate * 1000) / 10;
  return {
    id: `review-observed-leak-${largestObservedLeak.from.toLowerCase()}-${largestObservedLeak.to.toLowerCase()}`,
    title: `ทบทวนจุดรั่ว ${largestObservedLeak.from} → ${largestObservedLeak.to}`,
    summary: `Observed cohort มีการลดลง ${lossPercent}% ในช่วงนี้ ให้แก้จุดรั่วก่อนพิจารณาเพิ่มงบ Acquisition`,
    primary: true,
    humanApprovalRequired: true,
    executable: false,
    externalMutation: false,
    evidenceIds: [...largestObservedLeak.evidenceIds],
    status: 'REVIEW_OBSERVED_LEAK',
  };
}

function evaluateFinancialScaleGate(
  starterToCoreRate: EvidenceMetric,
  policy: FinancialScalePolicy | null,
): FinancialScaleGate {
  if (!policy?.approvedByHuman) {
    return {
      state: 'HUMAN_POLICY_REQUIRED',
      truthState: 'UNAVAILABLE',
      summary: 'ยังไม่มี human-approved Starter→Core threshold สำหรับใช้เป็น investment gate',
      humanApprovalRequired: true,
      executable: false,
      evidenceIds: [],
    };
  }

  const target = policy.minimumStarterToCoreRate;
  if (!isComputable(target) || target.value > 1 || starterToCoreRate.value === null || starterToCoreRate.truthState === 'UNAVAILABLE') {
    return {
      state: 'INSUFFICIENT_EVIDENCE',
      truthState: 'UNAVAILABLE',
      summary: 'มี policy แล้วแต่หลักฐาน conversion ยังไม่เพียงพอสำหรับตัดสินใจ',
      humanApprovalRequired: true,
      executable: false,
      evidenceIds: [...target.evidenceIds],
    };
  }

  const truthState: DashboardTruthState =
    starterToCoreRate.truthState === 'ASSUMED' || target.truthState === 'ASSUMED' ? 'ASSUMED' : 'DERIVED';
  const evidenceIds = uniqueEvidenceIds(starterToCoreRate.evidenceIds, target.evidenceIds);

  if (starterToCoreRate.value < target.value) {
    return {
      state: 'HOLD_ACQUISITION',
      truthState,
      summary: 'Starter→Core conversion ต่ำกว่า human-approved threshold; ถือการเพิ่มงบ Acquisition ไว้ก่อน',
      humanApprovalRequired: true,
      executable: false,
      evidenceIds,
    };
  }

  return {
    state: 'ELIGIBLE_FOR_HUMAN_SCALE_REVIEW',
    truthState,
    summary: 'Starter→Core conversion ถึง threshold แล้ว แต่การเพิ่มงบยังต้อง Human Approval และไม่ execute อัตโนมัติ',
    humanApprovalRequired: true,
    executable: false,
    evidenceIds,
  };
}

export function buildConsumerBehaviorFinancialLoop(
  snapshot: ActivationFunnelSnapshot,
  policy: FinancialScalePolicy | null = null,
): ConsumerBehaviorFinancialLoopModel {
  for (const metric of [
    snapshot.paidStarter,
    snapshot.activated48h,
    snapshot.firstValue7d,
    snapshot.w3Active,
    snapshot.corePaid,
    snapshot.renewed,
  ]) {
    assertMetric(metric);
  }

  const rates: Record<ActivationRateKey, EvidenceMetric> = {
    ACTIVATION_RATE_48H: deriveRatio('ACTIVATION_RATE_48H', snapshot.activated48h, snapshot.paidStarter),
    VERIFIED_FIRST_BUSINESS_OUTCOME_RATE: deriveRatio(
      'VERIFIED_FIRST_BUSINESS_OUTCOME_RATE',
      snapshot.firstValue7d,
      snapshot.paidStarter,
    ),
    W3_ACTIVE_RATE: deriveRatio('W3_ACTIVE_RATE', snapshot.w3Active, snapshot.paidStarter),
    STARTER_TO_CORE_CONVERSION: deriveRatio('STARTER_TO_CORE_CONVERSION', snapshot.corePaid, snapshot.paidStarter),
    CORE_RENEWAL_RATE: deriveRatio('CORE_RENEWAL_RATE', snapshot.renewed, snapshot.corePaid),
  };

  const largestObservedLeak = findLargestObservedLeak(snapshot);
  const primaryNba = buildPrimaryNba(rates.VERIFIED_FIRST_BUSINESS_OUTCOME_RATE, largestObservedLeak);
  const financialScaleGate = evaluateFinancialScaleGate(rates.STARTER_TO_CORE_CONVERSION, policy);

  return {
    workspaceId: snapshot.workspaceId,
    cohortId: snapshot.cohortId,
    segment: snapshot.segment,
    rates,
    largestObservedLeak,
    primaryNba,
    financialScaleGate,
  };
}
