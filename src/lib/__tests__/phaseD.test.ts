import { describe, expect, it } from 'vitest';
import { DEFAULT_DATA } from '../../data';
import { importMetrics, latestByMetric, normalizeGa4, normalizeMeta, normalizeYouTube } from '../channelMetrics';
import { buildImagePrompt, generateImage } from '../contentImage';
import { dashboardSnapshot } from '../dashboardSnapshot';

const ga4 = {
  metricHeaders: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'totalRevenue' }],
  rows: [{ metricValues: [{ value: '100' }, { value: '3' }, { value: '1500.5' }] }, { metricValues: [{ value: '50' }, { value: '2' }, { value: '0' }] }],
};
const yt = { columnHeaders: [{ name: 'day' }, { name: 'views' }], rows: [['2026-01-01', 10], ['2026-01-02', 15]] };
const meta = { data: [{ name: 'page_impressions', values: [{ value: 100 }, { value: 50 }] }, { name: 'page_total_media_view_unique', values: [{ value: 70 }] }, { name: 'page_actions_post_reactions_total', values: [{ value: { like: 3 } }] }] };

describe('channel normalizers', () => {
  it('sums GA4 rows by canonical metric', () => {
    const r = Object.fromEntries(normalizeGa4(ga4).map(x => [x.metric, x.value]));
    expect(r).toEqual({ sessions: 150, conversions: 5, revenue: 1500.5 });
  });
  it('maps YouTube views and ignores non-metric columns', () => {
    expect(normalizeYouTube(yt)).toEqual([{ metric: 'video_views', value: 25 }]);
  });
  it('maps Meta numeric values only, skipping object breakdowns', () => {
    const r = Object.fromEntries(normalizeMeta(meta).map(x => [x.metric, x.value]));
    expect(r).toEqual({ impressions: 150, reach: 70 });
  });
  it('returns nothing for unrelated or malformed input', () => {
    expect(normalizeGa4({})).toEqual([]);
    expect(normalizeYouTube(null)).toEqual([]);
    expect(normalizeMeta('x')).toEqual([]);
  });
});

describe('importMetrics', () => {
  it('fails closed on bad JSON and wrong-provider data', () => {
    expect(importMetrics('ga4', '{oops').ok).toBe(false);
    expect(importMetrics('meta', JSON.stringify(ga4)).ok).toBe(false);
  });
  it('produces MEASURED import records and latestByMetric keeps newest', () => {
    const a = importMetrics('ga4', JSON.stringify(ga4), {}, new Date('2026-01-01'));
    const b = importMetrics('ga4', JSON.stringify({ ...ga4, rows: [{ metricValues: [{ value: '7' }, { value: '1' }, { value: '0' }] }] }), {}, new Date('2026-02-01'));
    if (!a.ok || !b.ok) throw new Error('import failed');
    expect(a.records[0].maturity).toBe('MEASURED');
    expect(a.records[0].source).toBe('import');
    expect(latestByMetric([...a.records, ...b.records]).sessions?.value).toBe(7);
  });
});

describe('dashboard channel KPIs', () => {
  it('has no KPIs without imports (never fabricated)', () => {
    expect(dashboardSnapshot(structuredClone(DEFAULT_DATA)).channelKpis).toEqual([]);
  });
  it('shows imported values', () => {
    const d = structuredClone(DEFAULT_DATA);
    const r = importMetrics('youtube', JSON.stringify(yt));
    if (!r.ok) throw new Error('import failed');
    d.channelMetrics = r.records;
    expect(dashboardSnapshot(d).channelKpis[0]).toMatchObject({ metric: 'video_views', value: 25 });
  });
});

describe('content image (gated off by default)', () => {
  it('does not call any provider while imageGenLive is false', async () => {
    const r = await generateImage('หัวข้อ', 'เนื้อหา');
    expect(r.ok).toBe(false);
  });
  it('prompt forbids text/numbers in the picture', () => {
    expect(buildImagePrompt('a', 'b')).toContain('no text');
  });
});
