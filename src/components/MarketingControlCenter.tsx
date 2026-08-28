import type { AppData } from '../types';
import { CURRENT_STARTER_OFFER, measurementHealth } from '../lib/marketingTruth';

export default function MarketingControlCenter({ data }: { data: AppData }) {
  const campaigns = data.marketing.campaigns ?? [];
  const health = measurementHealth({ campaign: campaigns.length > 0, utm: false, activation: false, lead: false, customer: false, revenue: false });
  return (
    <section className="mkt-control-center" aria-label="Marketing Control Center">
      <div><small>ข้อเสนอที่อนุมัติ</small><strong>{CURRENT_STARTER_OFFER.plan.toUpperCase()} ฿{CURRENT_STARTER_OFFER.priceThbMonth}/เดือน</strong><span>OWNER DECISION · ห้าม AI เปลี่ยนราคาเอง</span></div>
      <div><small>Measurement Health</small><strong>{health.status === 'READY' ? 'พร้อมวินิจฉัย' : 'INSUFFICIENT DATA'}</strong><span>{health.missing.length ? `ขาด ${health.missing.join(', ')}` : 'สัญญาณครบ'}</span></div>
      <div><small>Top Issue / NBA</small><strong>{health.status === 'READY' ? 'วิเคราะห์หลักฐาน' : 'เก็บ tracked lead evidence'}</strong><span>{health.status === 'READY' ? 'Diagnosis ใช้ evidence เท่านั้น' : 'ยังไม่สรุป strategy หรือ winner'}</span></div>
    </section>
  );
}
