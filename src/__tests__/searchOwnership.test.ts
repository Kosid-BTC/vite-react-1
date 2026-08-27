import { describe, expect, it } from 'vitest';
import {
  CEO_AI_ENTITY,
  SEARCH_OWNERSHIP_CYCLE,
  calculateEci,
  classifySearchQuery,
  diagnoseSearchHealth,
  proposeSearchNba,
} from '../lib/searchOwnership';

describe('CEO AI Thailand canonical entity', () => {
  it('keeps CEO AI Thailand as the canonical brand', () => {
    expect(CEO_AI_ENTITY.canonicalName).toBe('CEO AI Thailand');
    expect(CEO_AI_ENTITY.aliases).toContain('ceoaithailand');
    expect(CEO_AI_ENTITY.aliases).not.toContain(CEO_AI_ENTITY.canonicalName);
  });
});

describe('search query classification', () => {
  it.each([
    'CEO AI Thailand',
    'ceoaithailand',
    'CEOAIThailand',
    'CEO AI ไทย',
  ])('classifies %s as BRAND', (query) => {
    expect(classifySearchQuery(query)).toBe('BRAND');
  });

  it('does not classify unrelated CEO queries as BRAND', () => {
    expect(classifySearchQuery('CEO Thailand')).toBe('ADJACENT');
    expect(classifySearchQuery('หลักสูตร CEO')).toBe('ADJACENT');
  });

  it('classifies category and problem demand separately', () => {
    expect(classifySearchQuery('AI สำหรับ SME ไทย')).toBe('CATEGORY');
    expect(classifySearchQuery('AI Business Operating System')).toBe('CATEGORY');
    expect(classifySearchQuery('หาลูกค้ารายแรก')).toBe('PROBLEM');
  });
});

describe('Entity Confusion Index', () => {
  it('returns insufficient data instead of fabricating a score', () => {
    const result = calculateEci({ brandConsistency: 80 });
    expect(result.status).toBe('INSUFFICIENT_DATA');
    if (result.status === 'INSUFFICIENT_DATA') {
      expect(result.missingSignals).toContain('ownedSerpCoverage');
    }
  });

  it('implements eci.v1 and lower confusion for stronger entity signals', () => {
    const strong = calculateEci({
      brandConsistency: 90,
      structuredEntityConsistency: 90,
      ownedSerpCoverage: 90,
      brandedQueryDominance: 90,
      associationAccuracy: 90,
    });
    const weak = calculateEci({
      brandConsistency: 30,
      structuredEntityConsistency: 30,
      ownedSerpCoverage: 30,
      brandedQueryDominance: 30,
      associationAccuracy: 30,
    });

    expect(strong.status).toBe('OK');
    expect(weak.status).toBe('OK');
    if (strong.status === 'OK' && weak.status === 'OK') {
      expect(strong.formulaVersion).toBe('eci.v1');
      expect(strong.entityStrength).toBe(90);
      expect(strong.eci).toBe(10);
      expect(strong.band).toBe('CLEAR');
      expect(weak.eci).toBe(70);
      expect(weak.band).toBe('HIGH_CONFUSION');
      expect(strong.eci).toBeLessThan(weak.eci);
    }
  });
});

describe('deterministic Growth Core proposal boundary', () => {
  it('proposes normalization for high confusion and keeps human approval', () => {
    const eci = calculateEci({
      brandConsistency: 30,
      structuredEntityConsistency: 30,
      ownedSerpCoverage: 30,
      brandedQueryDominance: 30,
      associationAccuracy: 30,
    });
    const diagnosis = diagnoseSearchHealth({
      eci,
      entityConsistency: 30,
      reliability: 'RELIABLE',
    });
    const nba = proposeSearchNba(diagnosis);

    expect(diagnosis.code).toBe('ENTITY_CONFUSION_HIGH');
    expect(nba.code).toBe('NORMALIZE_ENTITY_SIGNALS');
    expect(nba.requiresHumanApproval).toBe(true);
  });
});

describe('improvement cycle', () => {
  it('ends measurement with learning before closure', () => {
    expect(SEARCH_OWNERSHIP_CYCLE.indexOf('MEASURED')).toBeLessThan(
      SEARCH_OWNERSHIP_CYCLE.indexOf('LEARNED'),
    );
    expect(SEARCH_OWNERSHIP_CYCLE.at(-1)).toBe('CLOSED');
  });
});
