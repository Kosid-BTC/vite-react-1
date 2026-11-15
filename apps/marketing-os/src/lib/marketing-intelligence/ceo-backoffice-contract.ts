/**
 * CEO Back Office -> Marketing Intelligence contract.
 * Pure transformation only: no network, no privileged keys, no cross-project access.
 * Data is admitted only after the independent identity, workspace mapping and RLS gates.
 */
export type Evidence = {
  sourceProject: 'ceo-ai-backoffice';
  sourceTable: string;
  sourceRecordId: string;
  observedAt: string;
};
export type MarketingSignal = {
  metric: 'revenue' | 'gross_margin' | 'customer_count' | 'repeat_purchase_rate';
  value: number;
  unit: 'THB' | 'count' | 'ratio';
  periodStart: string;
  periodEnd: string;
  evidence: Evidence;
};
export type IntelligenceSnapshot = {
  primaryWorkspaceId: string;
  supplementaryWorkspaceId: string;
  generatedAt: string;
  signals: MarketingSignal[];
  unavailableMetrics: MarketingSignal['metric'][];
};
export type MappingAttestation = {
  primaryWorkspaceId: string;
  supplementaryWorkspaceId: string;
  verifiedBy: string;
  verifiedAt: string;
  expiresAt: string;
  status: 'approved' | 'revoked';
};

/** No inference from matching names, emails, or coincidentally equal IDs. */
export function isMappingAttested(
  mapping: MappingAttestation | null,
  primaryWorkspaceId: string,
  supplementaryWorkspaceId: string,
  now: Date,
): boolean {
  if (!mapping || mapping.status !== 'approved') return false;
  if (!mapping.verifiedBy || !mapping.verifiedAt) return false;
  const verified = Date.parse(mapping.verifiedAt);
  const expires = Date.parse(mapping.expiresAt);
  return Number.isFinite(verified) && Number.isFinite(expires)
    && verified <= now.getTime() && expires > now.getTime()
    && mapping.primaryWorkspaceId === primaryWorkspaceId
    && mapping.supplementaryWorkspaceId === supplementaryWorkspaceId;
}

/** Explicitly preserve missing metrics; never fabricate business KPIs. */
export function buildMarketingIntelligenceSnapshot(input: {
  primaryWorkspaceId: string;
  supplementaryWorkspaceId: string;
  mapping: MappingAttestation | null;
  now: Date;
  signals: MarketingSignal[];
}): IntelligenceSnapshot | null {
  if (!isMappingAttested(input.mapping, input.primaryWorkspaceId, input.supplementaryWorkspaceId, input.now)) return null;
  const allowed: MarketingSignal['metric'][] = ['revenue', 'gross_margin', 'customer_count', 'repeat_purchase_rate'];
  const signals = input.signals.filter(s =>
    allowed.includes(s.metric) && Number.isFinite(s.value)
    && Boolean(s.evidence.sourceTable && s.evidence.sourceRecordId)
    && s.evidence.sourceProject === 'ceo-ai-backoffice'
    && Number.isFinite(Date.parse(s.evidence.observedAt))
    && Number.isFinite(Date.parse(s.periodStart))
    && Number.isFinite(Date.parse(s.periodEnd))
    && Date.parse(s.periodStart) <= Date.parse(s.periodEnd)
    && (s.unit === (s.metric === 'revenue' ? 'THB' : s.metric === 'customer_count' ? 'count' : 'ratio'))
    && (s.metric !== 'gross_margin' && s.metric !== 'repeat_purchase_rate' || s.value >= 0 && s.value <= 1)
    && (s.metric !== 'customer_count' || s.value >= 0 && Number.isInteger(s.value))
  );
  return {
    primaryWorkspaceId: input.primaryWorkspaceId,
    supplementaryWorkspaceId: input.supplementaryWorkspaceId,
    generatedAt: input.now.toISOString(),
    signals,
    unavailableMetrics: allowed.filter(metric => !signals.some(s => s.metric === metric)),
  };
}
