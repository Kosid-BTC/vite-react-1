/** Dashboard operating snapshot (Phase A) — สรุป 4 ตัวบอกสถานะจากข้อมูลจริงเท่านั้น
 *  ไม่แต่งตัวเลข: ไม่มีแหล่งจริง = null/UNAVAILABLE (ตาม marketingTruth) · pure + tested */
import type { AppData, PageId } from '../types';
import { de24Journey } from './de24Journey';
import { financeSummary } from './finance';
import { measurementHealth, type MeasurementHealthResult, type MetricMaturity } from './marketingTruth';

/** สัญญาณที่ต้องครบก่อนวินิจฉัยการตลาด — utm = มีลิงก์ติดตามแล้ว · activation/lead/customer ยังไม่มีตัวเก็บใน V.1 → false */
export function marketingSignals(d: AppData): Record<string, boolean> {
  return {
    campaign: (d.marketing?.campaigns ?? []).length > 0,
    utm: (d.marketing?.utmLinks ?? []).length > 0,
    activation: false, lead: false, customer: false,
    revenue: financeSummary(d).hasRevenue,
  };
}

export interface NextAction { label: string; reason: string; goto: PageId }

export interface DashboardSnapshot {
  mit24: { done: number; total: number; pct: number; currentName: string | null };
  health: MeasurementHealthResult & { present: number; total: number };
  revenue: { value: number | null; maturity: MetricMaturity };
  nextAction: NextAction;
}

export function dashboardSnapshot(d: AppData): DashboardSnapshot {
  const j = de24Journey(d);
  const signals = marketingSignals(d);
  const h = measurementHealth(signals);
  const total = Object.keys(signals).length;
  const fin = financeSummary(d);

  let nextAction: NextAction;
  if (!j.complete && j.current) {
    nextAction = { label: `ทำขั้น #${j.current.num} ${j.current.name}`, reason: 'MIT 24 Steps — เดินทีละขั้น ไม่ข้าม', goto: 'bmc' };
  } else if (h.status === 'INSUFFICIENT_DATA') {
    nextAction = { label: 'เก็บหลักฐานลูกค้า/แคมเปญที่ติดตามได้', reason: `ยังขาดสัญญาณ: ${h.missing.join(', ')}`, goto: 'marketing' };
  } else {
    nextAction = { label: 'วิเคราะห์หลักฐานการตลาด', reason: 'สัญญาณครบแล้ว', goto: 'marketing' };
  }

  return {
    mit24: { done: j.done, total: j.total, pct: j.pct, currentName: j.current?.name ?? null },
    health: { ...h, present: total - h.missing.length, total },
    revenue: fin.hasRevenue ? { value: fin.revenue, maturity: 'MEASURED' } : { value: null, maturity: 'UNAVAILABLE' },
    nextAction,
  };
}
