import { describe, expect, it } from 'vitest';
import { CURRENT_STARTER_OFFER, LEGACY_STARTER_PRICES, assumptionDerivedMetric, createMarketingCycle, measuredMetric, measurementHealth, validateMarketingLineage } from '../marketingTruth';
describe('continuous marketing truth contract', () => {
  it('locks the owner-approved Starter offer and supersedes legacy prices', () => { expect(CURRENT_STARTER_OFFER.priceThbMonth).toBe(790); expect(LEGACY_STARTER_PRICES[390]).toBe('SUPERSEDED'); expect(LEGACY_STARTER_PRICES[590]).toBe('SUPERSEDED'); });
  it('fails closed to evidence collection when measurement is incomplete', () => { const health = measurementHealth({ campaign: true, utm: false, lead: false }); expect(createMarketingCycle({ campaignId: 'c1', variantId: 'a', landingPageId: 'lp1', ctaId: 'cta1' }, health).route).toBe('COLLECT_MORE_EVIDENCE'); expect(health.missing).toEqual(['utm', 'lead']); });
  it('routes to diagnosis only when all required signals are present', () => { expect(createMarketingCycle({ campaignId: 'c1', variantId: 'a', landingPageId: 'lp1', ctaId: 'cta1' }, measurementHealth({ campaign: true, utm: true, lead: true })).route).toBe('DIAGNOSE'); });
  it('keeps provenance and assumptions explicit', () => { expect(measuredMetric('revenue', 1000, 'paid_invoice', ['invoice-1']).maturity).toBe('MEASURED'); expect(assumptionDerivedMetric('ltv', 2500, 'revenue/customer', ['churn-4pct'], ['invoice-1']).maturity).toBe('DERIVED_FROM_ASSUMPTION'); expect(() => assumptionDerivedMetric('ltv', 1, 'x', [])).toThrow(); });
  it('requires the campaign-to-CTA lineage anchors', () => { expect(validateMarketingLineage({ campaignId: '', variantId: 'a', landingPageId: 'lp', ctaId: 'cta' })).toEqual(['campaignId']); });
});
