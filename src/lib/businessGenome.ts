/** Business Genome (Phase C) — 5 แกนที่ "คำนวณจากข้อมูลจริง" ไม่ใช่เลขแต่ง
 *  ทุกแกน maturity = DERIVED พร้อมคำอธิบายฐานคิด · ข้อมูลยังเป็น demo seed/ไม่มี = score null ("ยังไม่พอ") · pure/tested */
import { DEFAULT_DATA as SEED } from '../data';
import type { AppData } from '../types';
import type { MetricMaturity } from './marketingTruth';
import { isDemoPersonas } from './demoData';
import { DE24_DEFS } from './de24Sync';
import { approvalRate } from './contentLibrary';

export type GenomeAxisId = 'audience' | 'value' | 'offer' | 'channel' | 'content';
export interface GenomeAxis { id: GenomeAxisId; label: string; score: number | null; maturity: MetricMaturity; basis: string }

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const axis = (id: GenomeAxisId, label: string, score: number | null, basis: string): GenomeAxis =>
  ({ id, label, score, maturity: score === null ? 'UNAVAILABLE' : 'DERIVED', basis });

export function businessGenome(d: AppData): { axes: GenomeAxis[]; overall: number | null } {
  // Audience Fit — persona ที่ผู้ใช้ทำเองและมี pain+gain+goal ครบ
  const ps = d.personas ?? [];
  let audience: GenomeAxis;
  if (!ps.length || isDemoPersonas(d)) {
    audience = axis('audience', 'Audience Fit', null, 'ยังไม่มี Persona ของธุรกิจคุณ (ยังเป็นตัวอย่าง)');
  } else {
    const ok = ps.filter(p => (p.pains?.length ?? 0) > 0 && (p.gains?.length ?? 0) > 0 && p.goal.length > 0).length;
    audience = axis('audience', 'Audience Fit', pct(ok, ps.length), `${ok}/${ps.length} persona มี pain+gain+goal ครบ`);
  }

  // Value Proposition — ช่อง Value ใน BMC ที่ผู้ใช้แก้จากตัวอย่างแล้ว + VRIO ที่ Valuable
  const valueRaw = d.businessModel?.bmc?.value ?? [];
  const val = valueRaw.filter(x => x.trim());
  let value: GenomeAxis;
  if (!val.length || JSON.stringify(valueRaw) === JSON.stringify(SEED.businessModel?.bmc?.value ?? [])) {
    value = axis('value', 'Value Proposition', null, 'ช่อง Value ใน BMC ยังว่าง/เป็นตัวอย่าง');
  } else {
    const vr = (d.vrio ?? []).filter(v => v.v).length;
    value = axis('value', 'Value Proposition', Math.min(100, Math.min(val.length, 3) * 25 + Math.min(vr, 5) * 5),
      `${val.length} ข้อคุณค่าใน BMC + ${vr} ทรัพยากร VRIO ที่ Valuable`);
  }

  // Offer Strength — ความคืบหน้า MIT24 ระยะที่ 3 (index 2 = ทำให้ธุรกิจอยู่ได้: ราคา/คุ้มทุน)
  const p2 = DE24_DEFS.filter(x => x.phase === 2);
  const p2done = p2.filter(x => d.businessModel?.de24?.[x.index]?.done).length;
  const offer = (d.businessModel?.de24 ?? []).some(x => x.done)
    ? axis('offer', 'Offer Strength', pct(p2done, p2.length), `MIT24 ระยะ “ทำให้ธุรกิจอยู่ได้” ${p2done}/${p2.length} ขั้น`)
    : axis('offer', 'Offer Strength', null, 'ยังไม่เริ่ม MIT 24 Steps');

  // Channel Fit — มีช่องทางที่ใช้งาน + แคมเปญที่ผูกลิงก์ติดตาม
  const chs = (d.marketing?.channels ?? []).filter(c => c.active);
  const cps = d.marketing?.campaigns ?? [];
  const linked = new Set((d.marketing?.utmLinks ?? []).map(l => l.campaignId));
  const linkedCps = cps.filter(c => linked.has(c.id)).length;
  const channel = (!chs.length && !cps.length)
    ? axis('channel', 'Channel Fit', null, 'ยังไม่มีช่องทาง/แคมเปญ')
    : axis('channel', 'Channel Fit', (chs.length ? 50 : 0) + (cps.length ? Math.round((linkedCps / cps.length) * 50) : 0),
        `${chs.length} ช่องทางใช้งาน · ${linkedCps}/${cps.length} แคมเปญมีลิงก์ติดตาม`);

  // Content Quality — สัดส่วนเนื้อหาในคลังที่ผ่านด่านอนุมัติ
  const items = d.contentLibrary ?? [];
  const rate = approvalRate(items);
  const content = rate === null
    ? axis('content', 'Content Quality', null, 'ยังไม่มีเนื้อหาในคลัง')
    : axis('content', 'Content Quality', rate,
        `${items.filter(i => i.status === 'approved' || i.status === 'published').length}/${items.length} ชิ้นผ่านอนุมัติ+guardrail`);

  const axes = [audience, value, offer, channel, content];
  const known = axes.filter(a => a.score !== null) as (GenomeAxis & { score: number })[];
  return { axes, overall: known.length >= 3 ? Math.round(known.reduce((s, a) => s + a.score, 0) / known.length) : null };
}
