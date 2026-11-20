/** Channel metrics ingestion (Phase D) — แปลงคำตอบดิบของ GA4 / YouTube / Meta เป็นตัวเลขมาตรฐาน
 *  ใช้ได้ 2 ทาง: (1) นำเข้าเอง (วาง JSON ที่ได้จากแพลตฟอร์ม) (2) ตัวดึงอัตโนมัติ (ยังปิดอยู่ — ต้องมี OAuth app ของผู้ใช้)
 *  ทั้งสองทางผ่าน normalizer เดียวกัน → Dashboard แสดงเฉพาะตัวเลขที่มีแหล่งจริง · pure/tested
 *  TikTok / LinkedIn: ยังไม่มี normalizer (registry ระบุ planned) */
import type { MetricMaturity } from './marketingTruth';

export type ChannelProvider = 'ga4' | 'youtube' | 'meta';
export type CanonicalMetric = 'impressions' | 'reach' | 'video_views' | 'sessions' | 'users' | 'conversions' | 'revenue';

export interface MetricRecord {
  id: string;
  provider: ChannelProvider;
  metric: CanonicalMetric;
  value: number;
  periodStart?: string;
  periodEnd?: string;
  source: 'import' | 'api';
  maturity: MetricMaturity;
  importedAt: string;
}

export const PROVIDERS: Record<ChannelProvider | 'tiktok' | 'linkedin', { label: string; status: 'import' | 'planned'; hint: string }> = {
  ga4: { label: 'Google Analytics 4', status: 'import', hint: 'ผลลัพธ์ runReport (Data API) หรือ Explorations → JSON' },
  youtube: { label: 'YouTube Analytics', status: 'import', hint: 'ผลลัพธ์ reports.query (columnHeaders + rows)' },
  meta: { label: 'Facebook Page (Meta)', status: 'import', hint: 'ผลลัพธ์ /{page-id}/insights (data[].values[])' },
  tiktok: { label: 'TikTok', status: 'planned', hint: 'ยังไม่รองรับ' },
  linkedin: { label: 'LinkedIn', status: 'planned', hint: 'ยังไม่รองรับ' },
};

/** ชื่อ metric ของ Meta เปลี่ยนบ่อย — แก้ตารางนี้ที่เดียวเมื่อ Meta ปรับ */
export const META_METRIC_MAP: Record<string, CanonicalMetric> = {
  page_impressions: 'impressions', page_media_view: 'impressions',
  page_impressions_unique: 'reach', page_total_media_view_unique: 'reach',
  page_video_views: 'video_views',
};
const GA4_METRIC_MAP: Record<string, CanonicalMetric> = {
  sessions: 'sessions', activeUsers: 'users', totalUsers: 'users',
  conversions: 'conversions', keyEvents: 'conversions', totalRevenue: 'revenue', purchaseRevenue: 'revenue',
};
const YT_METRIC_MAP: Record<string, CanonicalMetric> = { views: 'video_views' };

type Raw = Record<string, unknown>;
const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);

export interface NormalizedValue { metric: CanonicalMetric; value: number }

/** GA4 Data API runReport: metricHeaders[].name + rows[].metricValues[].value (รวมทุกแถว) */
export function normalizeGa4(raw: unknown): NormalizedValue[] {
  if (!isObj(raw) || !Array.isArray(raw.metricHeaders) || !Array.isArray(raw.rows)) return [];
  const names = raw.metricHeaders.map(h => (isObj(h) ? String(h.name) : ''));
  const sums = new Map<CanonicalMetric, number>();
  for (const row of raw.rows) {
    const vals = isObj(row) && Array.isArray(row.metricValues) ? row.metricValues : [];
    vals.forEach((mv, i) => {
      const m = GA4_METRIC_MAP[names[i]]; const n = isObj(mv) ? num(mv.value) : null;
      if (m && n !== null) sums.set(m, (sums.get(m) ?? 0) + n);
    });
  }
  return [...sums].map(([metric, value]) => ({ metric, value }));
}

/** YouTube Analytics reports.query: columnHeaders[].name + rows[][] (รวมทุกแถว) */
export function normalizeYouTube(raw: unknown): NormalizedValue[] {
  if (!isObj(raw) || !Array.isArray(raw.columnHeaders) || !Array.isArray(raw.rows)) return [];
  const names = raw.columnHeaders.map(h => (isObj(h) ? String(h.name) : ''));
  const sums = new Map<CanonicalMetric, number>();
  for (const row of raw.rows) {
    if (!Array.isArray(row)) continue;
    row.forEach((v, i) => {
      const m = YT_METRIC_MAP[names[i]]; const n = num(v);
      if (m && n !== null) sums.set(m, (sums.get(m) ?? 0) + n);
    });
  }
  return [...sums].map(([metric, value]) => ({ metric, value }));
}

/** Meta Page Insights: data[].{name, values[].value} — รวมเฉพาะค่าตัวเลข (ข้าม object breakdown) */
export function normalizeMeta(raw: unknown): NormalizedValue[] {
  if (!isObj(raw) || !Array.isArray(raw.data)) return [];
  const sums = new Map<CanonicalMetric, number>();
  for (const item of raw.data) {
    if (!isObj(item)) continue;
    const m = META_METRIC_MAP[String(item.name)];
    if (!m || !Array.isArray(item.values)) continue;
    let total = 0; let any = false;
    for (const v of item.values) { const n = isObj(v) ? num(v.value) : null; if (n !== null) { total += n; any = true; } }
    if (any) sums.set(m, (sums.get(m) ?? 0) + total);
  }
  return [...sums].map(([metric, value]) => ({ metric, value }));
}

const NORMALIZERS: Record<ChannelProvider, (raw: unknown) => NormalizedValue[]> = { ga4: normalizeGa4, youtube: normalizeYouTube, meta: normalizeMeta };

export type ImportResult = { ok: true; records: MetricRecord[] } | { ok: false; reason: string };

/** วาง JSON ดิบจากแพลตฟอร์ม → MetricRecord[] · fail closed ถ้า JSON เสียหรือไม่พบ metric ที่รู้จัก */
export function importMetrics(provider: ChannelProvider, jsonText: string, period: { start?: string; end?: string } = {}, now = new Date()): ImportResult {
  let raw: unknown;
  try { raw = JSON.parse(jsonText); } catch { return { ok: false, reason: 'JSON ไม่ถูกต้อง' }; }
  const found = NORMALIZERS[provider](raw);
  if (!found.length) return { ok: false, reason: 'ไม่พบ metric ที่รองรับในข้อมูลนี้ — ตรวจว่าเลือกแพลตฟอร์มตรงกับข้อมูลที่วาง' };
  const stamp = now.toISOString();
  return {
    ok: true,
    records: found.map(f => ({
      id: `mr_${now.getTime().toString(36)}_${provider}_${f.metric}`, provider, metric: f.metric, value: f.value,
      periodStart: period.start, periodEnd: period.end, source: 'import', maturity: 'MEASURED', importedAt: stamp,
    })),
  };
}

/** ค่าล่าสุดต่อ (provider, metric) — ใช้แสดง KPI · ไม่มีข้อมูล = ไม่มี key (UNAVAILABLE ที่ชั้น UI) */
export function latestByMetric(records: MetricRecord[]): Partial<Record<CanonicalMetric, MetricRecord>> {
  const out: Partial<Record<CanonicalMetric, MetricRecord>> = {};
  for (const r of [...records].sort((a, b) => a.importedAt.localeCompare(b.importedAt))) out[r.metric] = r;
  return out;
}
