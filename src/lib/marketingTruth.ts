/** Evidence maturity and lineage contracts for the continuous marketing loop. */
export type MetricMaturity = 'MEASURED' | 'DERIVED' | 'DERIVED_FROM_ASSUMPTION' | 'ASSUMED' | 'PLACEHOLDER' | 'UNAVAILABLE';
export interface MarketingMetric<T extends number = number> { id: string; value: T | null; maturity: MetricMaturity; source: string; observedAt?: string; evidenceRefs: string[]; assumptionRefs: string[]; }
export interface MarketingFunnelLineage { campaignId: string; variantId: string; landingPageId: string; ctaId: string; activationId?: string; leadId?: string; customerId?: string; revenueId?: string; }
export type MeasurementHealth = 'READY' | 'INSUFFICIENT_DATA';
export interface MeasurementHealthResult { status: MeasurementHealth; missing: string[]; }
export interface ContinuousMarketingCycle { offer: { plan: 'starter'; priceThbMonth: 790; status: 'APPROVED_CURRENT'; authority: 'OWNER_DECISION' }; measurementHealth: MeasurementHealthResult; route: 'DIAGNOSE' | 'COLLECT_MORE_EVIDENCE'; lineage: MarketingFunnelLineage; }
export const CURRENT_STARTER_OFFER = { plan: 'starter', priceThbMonth: 790, status: 'APPROVED_CURRENT', authority: 'OWNER_DECISION', effectiveFor: ['marketing', 'landing_page', 'seo_copy', 'llms', 'campaign_offer', 'pricing_ui'] as const } as const;
export const LEGACY_STARTER_PRICES = { 390: 'SUPERSEDED', 590: 'SUPERSEDED' } as const;
export function measurementHealth(requiredSignals: Record<string, boolean>): MeasurementHealthResult { const missing = Object.entries(requiredSignals).filter(([, present]) => !present).map(([name]) => name); return { status: missing.length ? 'INSUFFICIENT_DATA' : 'READY', missing }; }
export function createMarketingCycle(lineage: MarketingFunnelLineage, health: MeasurementHealthResult): ContinuousMarketingCycle { return { offer: { plan: 'starter', priceThbMonth: 790, status: 'APPROVED_CURRENT', authority: 'OWNER_DECISION' }, measurementHealth: health, route: health.status === 'READY' ? 'DIAGNOSE' : 'COLLECT_MORE_EVIDENCE', lineage }; }
export function validateMarketingLineage(lineage: MarketingFunnelLineage): string[] {
  const missing = (['campaignId', 'variantId', 'landingPageId', 'ctaId'] as const).filter(key => !lineage[key]?.trim());
  return missing;
}
export function measuredMetric(id: string, value: number, source: string, evidenceRefs: string[] = []): MarketingMetric { if (!Number.isFinite(value)) throw new Error('Measured metric must be finite'); return { id, value, maturity: 'MEASURED', source, evidenceRefs, assumptionRefs: [] }; }
export function assumptionDerivedMetric(id: string, value: number, source: string, assumptionRefs: string[], evidenceRefs: string[] = []): MarketingMetric { if (!Number.isFinite(value)) throw new Error('Derived metric must be finite'); if (!assumptionRefs.length) throw new Error('Assumption-derived metric requires assumption references'); return { id, value, maturity: 'DERIVED_FROM_ASSUMPTION', source, evidenceRefs, assumptionRefs }; }
