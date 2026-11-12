/** Business Evolution Intelligence v0.1: diagnostic rubric, not survival prediction.
 * Missing evidence is unknown, never silently scored as zero.
 */
export const BEI_VERSION = '0.1.0' as const;
export const DIMENSIONS = [
  { id: 'identity_vrio', labelTh: 'อัตลักษณ์และ VRIO', weight: 0.15 },
  { id: 'financial_resilience', labelTh: 'ความยืดหยุ่นทางการเงิน', weight: 0.25 },
  { id: 'product_market_fit', labelTh: 'ความเหมาะสมกับตลาด', weight: 0.20 },
  { id: 'growth_economics', labelTh: 'การเติบโตและเศรษฐศาสตร์หน่วย', weight: 0.20 },
  { id: 'adaptability_plc', labelTh: 'การปรับตัวและวงจรผลิตภัณฑ์', weight: 0.10 },
  { id: 'operational_excellence', labelTh: 'ประสิทธิภาพกระบวนการ', weight: 0.10 },
] as const;
export type DimensionId = typeof DIMENSIONS[number]['id'];
export type EvidenceLevel = 'self_reported' | 'observed' | 'verified';
export type EvidenceSource = 'survey' | 'financial_record' | 'product_analytics' | 'crm' | 'qms' | 'other';

export interface EvidenceRecord {
  id: string;
  organizationId: string;
  dimension: DimensionId;
  source: EvidenceSource;
  level: EvidenceLevel;
  capturedAt: string;
  reference: string; // internal reference; never include credentials or customer PII
  description: string;
  consentRecorded: boolean;
}
export interface AssessmentInput {
  organizationId: string;
  evidence: readonly EvidenceRecord[];
  /** Human-assessed rubric scores 0..100; LLM must not invent values. */
  ratings: readonly { dimension: DimensionId; score: number; evidenceIds: readonly string[] }[];
  criticalLiquidityRisk?: boolean;
}
export interface AssessmentResult {
  modelVersion: typeof BEI_VERSION;
  status: 'complete' | 'incomplete';
  score: number | null;
  evidenceCoverage: number;
  missingDimensions: DimensionId[];
  priority: { dimension: DimensionId; gap: number }[];
  warnings: string[];
}
const validDimension = (id: string): id is DimensionId => DIMENSIONS.some(d => d.id === id);
export function validateEvidence(record: EvidenceRecord, organizationId: string): string[] {
  const errors: string[] = [];
  if (!record.id.trim() || !record.reference.trim() || !record.description.trim()) errors.push('missing_evidence_fields');
  if (record.organizationId !== organizationId) errors.push('cross_organization_evidence');
  if (!validDimension(record.dimension)) errors.push('unknown_dimension');
  if (!['survey', 'financial_record', 'product_analytics', 'crm', 'qms', 'other'].includes(record.source)) errors.push('unknown_source');
  if (!['self_reported', 'observed', 'verified'].includes(record.level)) errors.push('unknown_evidence_level');
  if (!record.consentRecorded) errors.push('consent_not_recorded');
  if (!Number.isFinite(Date.parse(record.capturedAt))) errors.push('invalid_capture_time');
  return errors;
}
export function calculateAssessment(input: AssessmentInput): AssessmentResult {
  if (!input.organizationId.trim()) throw new Error('organization_id_required');
  const warnings: string[] = [];
  const byEvidenceId = new Map<string, EvidenceRecord>();
  for (const record of input.evidence) {
    if (byEvidenceId.has(record.id)) throw new Error('duplicate_evidence_id');
    byEvidenceId.set(record.id, record);
  }
  const byDimension = new Map<DimensionId, { score: number; evidenceIds: readonly string[] }>();
  for (const rating of input.ratings) {
    if (!validDimension(rating.dimension)) throw new Error('unknown_dimension');
    if (byDimension.has(rating.dimension)) throw new Error('duplicate_dimension');
    if (!Number.isFinite(rating.score) || rating.score < 0 || rating.score > 100) throw new Error('score_out_of_range');
    byDimension.set(rating.dimension, rating);
  }
  let weightedScore = 0;
  let coverage = 0;
  const missingDimensions: DimensionId[] = [];
  const priority: AssessmentResult['priority'] = [];
  for (const dimension of DIMENSIONS) {
    const rating = byDimension.get(dimension.id);
    const eligible = rating?.evidenceIds.some(id => {
      const record = byEvidenceId.get(id);
      return record?.dimension === dimension.id && validateEvidence(record, input.organizationId).length === 0;
    }) ?? false;
    if (!rating || !eligible) {
      missingDimensions.push(dimension.id);
      continue;
    }
    weightedScore += rating.score * dimension.weight;
    coverage += dimension.weight;
    priority.push({ dimension: dimension.id, gap: Math.round((100 - rating.score) * dimension.weight * 100) / 100 });
    if (rating.evidenceIds.some(id => byEvidenceId.get(id)?.level === 'self_reported')) warnings.push('self_reported:' + dimension.id);
  }
  if (missingDimensions.length) warnings.push('incomplete_evidence');
  if (input.criticalLiquidityRisk) warnings.push('critical_liquidity_risk_requires_immediate_review');
  priority.sort((a, b) => b.gap - a.gap);
  return {
    modelVersion: BEI_VERSION,
    status: missingDimensions.length ? 'incomplete' : 'complete',
    score: missingDimensions.length ? null : Math.round(weightedScore * 100) / 100,
    evidenceCoverage: Math.round(coverage * 10000) / 10000,
    missingDimensions,
    priority,
    warnings: [...new Set(warnings)],
  };
}
/** Monthly active-user accounting; deduplicate referral conversions upstream. */
export function projectActiveUsers(active: number, churnRate: number, referred: number, otherNew: number): number {
  if (![active, churnRate, referred, otherNew].every(Number.isFinite) ||
      active < 0 || referred < 0 || otherNew < 0 || churnRate < 0 || churnRate > 1) {
    throw new Error('invalid_growth_inputs');
  }
  return active * (1 - churnRate) + referred + otherNew;
}
