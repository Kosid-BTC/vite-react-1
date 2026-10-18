import { describe, expect, it } from 'vitest';
import { calculateAssessment, DIMENSIONS, projectActiveUsers, validateEvidence } from '../businessEvolution';
import type { AssessmentInput, EvidenceRecord } from '../businessEvolution';
import { BUSINESS_ASSESSMENT_QUESTIONS } from '../businessEvolution/questionnaire';
const org = 'org-a';
const records: EvidenceRecord[] = DIMENSIONS.map((d, i) => ({
  id: 'ev-' + i, organizationId: org, dimension: d.id, source: 'survey',
  level: 'self_reported', capturedAt: '2026-10-19T00:00:00Z',
  reference: 'internal:' + i, description: 'Pilot evidence', consentRecorded: true,
}));
const base: AssessmentInput = {
  organizationId: org, evidence: records,
  ratings: DIMENSIONS.map((d, i) => ({ dimension: d.id, score: [75, 35, 60, 40, 70, 65][i], evidenceIds: ['ev-' + i] })),
};
describe('Business Evolution Intelligence v0.1', () => {
  it('computes weighted score only when all dimensions have evidence', () => {
    const result = calculateAssessment(base);
    expect(result.status).toBe('complete');
    expect(result.score).toBe(53.5);
    expect(result.evidenceCoverage).toBe(1);
    expect(result.priority[0].dimension).toBe('financial_resilience');
  });
  it('does not treat missing evidence as zero or extrapolate a partial score', () => {
    const result = calculateAssessment({ ...base, evidence: records.slice(1) });
    expect(result.status).toBe('incomplete');
    expect(result.score).toBeNull();
    expect(result.evidenceCoverage).toBe(0.85);
    expect(result.missingDimensions).toContain('identity_vrio');
  });
  it('rejects cross-tenant evidence', () => {
    const result = calculateAssessment({ ...base, evidence: [{ ...records[0], organizationId: 'org-b' }, ...records.slice(1)] });
    expect(result.score).toBeNull();
    expect(validateEvidence({ ...records[0], organizationId: 'org-b' }, org)).toContain('cross_organization_evidence');
  });
  it('rejects missing consent, invalid score and duplicates', () => {
    expect(calculateAssessment({ ...base, evidence: [{ ...records[0], consentRecorded: false }, ...records.slice(1)] }).score).toBeNull();
    expect(() => calculateAssessment({ ...base, ratings: [{ ...base.ratings[0], score: 101 }] })).toThrow('score_out_of_range');
    expect(() => calculateAssessment({ ...base, evidence: [...records, records[0]] })).toThrow('duplicate_evidence_id');
  });
  it('flags liquidity risk independently of composite score', () => {
    expect(calculateAssessment({ ...base, criticalLiquidityRisk: true }).warnings).toContain('critical_liquidity_risk_requires_immediate_review');
  });
  it('models retention and referrals without comparing K directly with churn', () => {
    expect(projectActiveUsers(100, 0.1, 15, 5)).toBe(110);
    expect(() => projectActiveUsers(100, 1.1, 15, 5)).toThrow('invalid_growth_inputs');
  });
  it('covers all six diagnostic dimensions in Thai', () => {
    expect(BUSINESS_ASSESSMENT_QUESTIONS.length).toBe(6);
    expect(new Set(BUSINESS_ASSESSMENT_QUESTIONS.map(q => q.dimension)).size).toBe(6);
  });
});
