import { beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetAttributionForTest, attributionParams, buildTrackedUrl, captureFirstTouch, parseAttribution } from '../utm';

const base = { baseUrl: 'https://ceoaithailand.org/start', campaignId: 'c1', campaignName: 'Launch ก.ย.', channelType: 'social' as const, variantId: 'a', landingPageId: 'start', ctaId: 'primary' };

describe('utm builder/parser', () => {
  beforeEach(() => {
    _resetAttributionForTest();
    const m = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } });
  });
  it('builds a link carrying full lineage', () => {
    const r = buildTrackedUrl(base);
    if ('error' in r) throw new Error(r.error);
    const q = new URL(r.url).searchParams;
    expect(q.get('utm_source')).toBe('social');
    expect(q.get('ceo_cmp')).toBe('c1');
    expect(q.get('ceo_cta')).toBe('primary');
    expect(q.get('utm_content')).toBe('a_primary');
  });
  it('fails closed on missing lineage or bad url', () => {
    expect('error' in buildTrackedUrl({ ...base, ctaId: '' })).toBe(true);
    expect('error' in buildTrackedUrl({ ...base, baseUrl: 'javascript:alert(1)' })).toBe(true);
    expect('error' in buildTrackedUrl({ ...base, baseUrl: 'not a url' })).toBe(true);
  });
  it('round-trips through parseAttribution', () => {
    const r = buildTrackedUrl(base);
    if ('error' in r) throw new Error(r.error);
    const a = parseAttribution(new URL(r.url).search);
    expect(a?.ceo_var).toBe('a');
    expect(parseAttribution('?foo=bar')).toBeNull();
  });
  it('keeps first touch and does not persist without consent', () => {
    const t = 1_000_000;
    captureFirstTouch('?utm_campaign=one', t);
    expect(captureFirstTouch('?utm_campaign=two', t + 1)?.utm_campaign).toBe('one');
    expect(localStorage.getItem('ceo_ai_attr_v1')).toBeNull();
  });
  it('flattens params with attr_ prefix', () => {
    expect(attributionParams({ utm_source: 'x', ceo_cmp: 'c1', capturedAt: 1 })).toEqual({ attr_source: 'x', attr_ceo_cmp: 'c1' });
  });
});
