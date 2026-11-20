import { describe, expect, it } from 'vitest';
import { DEFAULT_DATA } from '../../data';
import { dashboardSnapshot, marketingSignals } from '../dashboardSnapshot';

describe('dashboardSnapshot (no fabricated numbers)', () => {
  const d = structuredClone(DEFAULT_DATA);
  it('reports revenue as UNAVAILABLE when no revenue is recorded', () => {
    const s = dashboardSnapshot({ ...d, finance: [] } as typeof d);
    expect(s.revenue).toEqual({ value: null, maturity: 'UNAVAILABLE' });
  });
  it('keeps utm/lead signals missing so health is INSUFFICIENT_DATA', () => {
    const sig = marketingSignals(d);
    expect(sig.utm).toBe(false);
    const s = dashboardSnapshot(d);
    expect(s.health.status).toBe('INSUFFICIENT_DATA');
    expect(s.health.present + s.health.missing.length).toBe(s.health.total);
  });
  it('points next action at a real page', () => {
    expect(['bmc', 'marketing']).toContain(dashboardSnapshot(d).nextAction.goto);
  });
});
