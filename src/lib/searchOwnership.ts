export const CEO_AI_ENTITY = {
  canonicalName: 'CEO AI Thailand',
  aliases: ['ceoaithailand', 'CEOAIThailand', 'CEO AI ไทย'] as const,
  category: 'AI Business Operating System',
  categoryDescriptor: 'AI Business Operating System สำหรับผู้เริ่มต้นธุรกิจและ SME ไทย',
  organizationId: 'https://ceoaithailand.org/#organization',
  websiteId: 'https://ceoaithailand.org/#website',
  market: 'TH',
} as const;

export type SearchRing = 'BRAND' | 'CATEGORY' | 'PROBLEM' | 'ADJACENT' | 'OTHER';
export type EvidenceReliability = 'RELIABLE' | 'CAUTION' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';
export type RiskDecision = 'PROCEED' | 'PROCEED_WITH_CONTROLS' | 'HOLD_FOR_EVIDENCE' | 'DO_NOT_PROCEED';
export type EciBand = 'CLEAR' | 'LOW_CONFUSION' | 'CAUTION' | 'HIGH_CONFUSION';

export type ImprovementCycleState =
  | 'OBSERVED'
  | 'OPPORTUNITY_CLASSIFIED'
  | 'RISK_ASSESSED'
  | 'ENTITY_CONTROLLED'
  | 'OWNERSHIP_MEASURED'
  | 'ECI_EVALUATED'
  | 'DIAGNOSED'
  | 'NBA_PROPOSED'
  | 'APPROVED'
  | 'ACTIONED'
  | 'MEASURED'
  | 'LEARNED'
  | 'CLOSED';

export interface SearchEvidence {
  workspaceId: string;
  source: 'GSC' | 'SERP' | 'SITE_AUDIT' | 'SOCIAL_AUDIT' | 'MANUAL_VERIFIED';
  observedAt: string;
  reliability: EvidenceReliability;
  query?: string;
  pageUrl?: string;
  resultUrl?: string;
  country?: string;
  device?: string;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
  owned?: boolean;
  metadata?: Record<string, unknown>;
}

export interface EciComponents {
  brandConsistency?: number;
  structuredEntityConsistency?: number;
  ownedSerpCoverage?: number;
  brandedQueryDominance?: number;
  associationAccuracy?: number;
}

export type EciResult =
  | {
      status: 'OK';
      formulaVersion: 'eci.v1';
      entityStrength: number;
      eci: number;
      band: EciBand;
      missingSignals: [];
    }
  | {
      status: 'INSUFFICIENT_DATA';
      formulaVersion: 'eci.v1';
      missingSignals: (keyof EciComponents)[];
    };

export interface SearchDiagnosis {
  code:
    | 'ENTITY_CONFUSION_HIGH'
    | 'BRANDED_CTR_WEAK'
    | 'CATEGORY_PAGE_WEAK'
    | 'OWNED_SERP_WEAK'
    | 'NO_ACTIONABLE_DIAGNOSIS';
  summary: string;
  reliability: EvidenceReliability;
}

export interface NextBestAction {
  code:
    | 'NORMALIZE_ENTITY_SIGNALS'
    | 'TEST_BRANDED_SERP_MESSAGE'
    | 'IMPROVE_EXISTING_CATEGORY_PAGE'
    | 'STRENGTHEN_OWNED_ENTITY_GRAPH'
    | 'COLLECT_MORE_EVIDENCE';
  title: string;
  expectedLearning: string;
  requiresHumanApproval: true;
}

const BRAND_QUERIES = new Set([
  'ceoaithailand',
  'ceo ai thailand',
  'ceoai thailand',
  'ceo ai ไทย',
]);

const CATEGORY_PATTERNS = [
  /ai\s+business\s+operating\s+system/i,
  /ai\s*(สำหรับ|for)\s*sme/i,
  /ai\s*marketing\s*(สำหรับ|for)?\s*sme/i,
  /ai\s*ช่วยเริ่มธุรกิจ/i,
  /ai\s*สำหรับเจ้าของธุรกิจ/i,
];

const PROBLEM_PATTERNS = [
  /เริ่มธุรกิจ(ยังไง|อย่างไร|ด้วย ai)?/i,
  /หาลูกค้ารายแรก/i,
  /ทดสอบไอเดียธุรกิจ/i,
  /ทำการตลาดด้วย ai/i,
  /วัดผลการตลาด/i,
  /ตั้งราคาสินค้า/i,
];

const ADJACENT_QUERIES = new Set([
  'ceo thailand',
  'digital ceo',
  'ai ceo',
  'ceo ยุค ai',
  'หลักสูตร ceo',
]);

function normalizeQuery(query: string): string {
  return query.trim().toLocaleLowerCase('th-TH').replace(/\s+/g, ' ');
}

export function classifySearchQuery(query: string): SearchRing {
  const normalized = normalizeQuery(query);
  if (!normalized) return 'OTHER';
  if (BRAND_QUERIES.has(normalized)) return 'BRAND';
  if (CATEGORY_PATTERNS.some((pattern) => pattern.test(normalized))) return 'CATEGORY';
  if (PROBLEM_PATTERNS.some((pattern) => pattern.test(normalized))) return 'PROBLEM';
  if (ADJACENT_QUERIES.has(normalized)) return 'ADJACENT';
  return 'OTHER';
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateEci(components: EciComponents): EciResult {
  const required: (keyof EciComponents)[] = [
    'brandConsistency',
    'structuredEntityConsistency',
    'ownedSerpCoverage',
    'brandedQueryDominance',
    'associationAccuracy',
  ];
  const missingSignals = required.filter((key) => components[key] == null);
  if (missingSignals.length > 0) {
    return { status: 'INSUFFICIENT_DATA', formulaVersion: 'eci.v1', missingSignals };
  }

  const b = clampScore(components.brandConsistency!);
  const s = clampScore(components.structuredEntityConsistency!);
  const o = clampScore(components.ownedSerpCoverage!);
  const q = clampScore(components.brandedQueryDominance!);
  const a = clampScore(components.associationAccuracy!);
  const entityStrength = round2(0.3 * b + 0.25 * s + 0.2 * o + 0.15 * q + 0.1 * a);
  const eci = round2(100 - entityStrength);
  const band: EciBand = eci <= 20 ? 'CLEAR' : eci <= 40 ? 'LOW_CONFUSION' : eci <= 60 ? 'CAUTION' : 'HIGH_CONFUSION';

  return { status: 'OK', formulaVersion: 'eci.v1', entityStrength, eci, band, missingSignals: [] };
}

export function diagnoseSearchHealth(input: {
  eci?: EciResult;
  entityConsistency?: number;
  brandedImpressionsTrend?: 'UP' | 'FLAT' | 'DOWN';
  brandedCtrHealth?: 'STRONG' | 'WEAK' | 'UNKNOWN';
  categoryImpressionsPresent?: boolean;
  categoryPageHealth?: 'STRONG' | 'WEAK' | 'UNKNOWN';
  ownedSerpCoverage?: number;
  reliability: EvidenceReliability;
}): SearchDiagnosis {
  if (input.eci?.status === 'OK' && input.eci.band === 'HIGH_CONFUSION' && (input.entityConsistency ?? 100) < 70) {
    return { code: 'ENTITY_CONFUSION_HIGH', summary: 'Canonical entity signals remain inconsistent while entity confusion is high.', reliability: input.reliability };
  }
  if (input.brandedImpressionsTrend === 'UP' && input.brandedCtrHealth === 'WEAK') {
    return { code: 'BRANDED_CTR_WEAK', summary: 'Brand visibility is increasing but branded search-result messaging is not converting attention efficiently.', reliability: input.reliability };
  }
  if (input.categoryImpressionsPresent && input.categoryPageHealth === 'WEAK') {
    return { code: 'CATEGORY_PAGE_WEAK', summary: 'Qualified category demand exists but the current relevant page is weak.', reliability: input.reliability };
  }
  if (typeof input.ownedSerpCoverage === 'number' && input.ownedSerpCoverage < 50) {
    return { code: 'OWNED_SERP_WEAK', summary: 'Verified owned properties occupy too little of the measured branded SERP.', reliability: input.reliability };
  }
  return { code: 'NO_ACTIONABLE_DIAGNOSIS', summary: 'Current evidence does not support a stronger deterministic diagnosis.', reliability: input.reliability };
}

export function proposeSearchNba(diagnosis: SearchDiagnosis): NextBestAction {
  switch (diagnosis.code) {
    case 'ENTITY_CONFUSION_HIGH':
      return {
        code: 'NORMALIZE_ENTITY_SIGNALS',
        title: 'Normalize canonical Entity Hub and structured entity signals',
        expectedLearning: 'Test whether stronger canonical consistency reduces entity confusion over the review window.',
        requiresHumanApproval: true,
      };
    case 'BRANDED_CTR_WEAK':
      return {
        code: 'TEST_BRANDED_SERP_MESSAGE',
        title: 'Test branded title and meta proposition',
        expectedLearning: 'Test whether clearer branded search messaging improves qualified branded CTR without changing the canonical brand.',
        requiresHumanApproval: true,
      };
    case 'CATEGORY_PAGE_WEAK':
      return {
        code: 'IMPROVE_EXISTING_CATEGORY_PAGE',
        title: 'Improve the strongest existing category page',
        expectedLearning: 'Test whether improving an existing intent-matched page captures category demand without creating cannibalization.',
        requiresHumanApproval: true,
      };
    case 'OWNED_SERP_WEAK':
      return {
        code: 'STRENGTHEN_OWNED_ENTITY_GRAPH',
        title: 'Strengthen verified owned entity signals',
        expectedLearning: 'Test whether stronger owned-property consistency improves branded SERP coverage.',
        requiresHumanApproval: true,
      };
    default:
      return {
        code: 'COLLECT_MORE_EVIDENCE',
        title: 'Collect more trusted search evidence',
        expectedLearning: 'Increase evidence maturity before making a material Search Ownership change.',
        requiresHumanApproval: true,
      };
  }
}

export const SEARCH_OWNERSHIP_CYCLE: readonly ImprovementCycleState[] = [
  'OBSERVED',
  'OPPORTUNITY_CLASSIFIED',
  'RISK_ASSESSED',
  'ENTITY_CONTROLLED',
  'OWNERSHIP_MEASURED',
  'ECI_EVALUATED',
  'DIAGNOSED',
  'NBA_PROPOSED',
  'APPROVED',
  'ACTIONED',
  'MEASURED',
  'LEARNED',
  'CLOSED',
] as const;
