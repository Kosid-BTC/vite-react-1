import type { AppData, PageId } from '../types';
import { dashboardSnapshot } from '../lib/dashboardSnapshot';
import { track } from '../lib/analytics';

/** แถบสถานะบน Dashboard (Phase A ตาม docs/ux/UX-UI-V1-MAPPING.md) — เฉพาะข้อมูลจริง */
export default function OperatingSnapshot({ data, onNavigate }: { data: AppData; onNavigate: (p: PageId) => void }) {
  const s = dashboardSnapshot(data);
  const go = (card: string, page: PageId) => { track('snapshot_card_click', { card }); onNavigate(page); };
  return (
    <section className="op-snap" aria-label="สถานะการดำเนินงาน">
      <button className="op-card" onClick={() => go('mit24', 'bmc')}>
        <small>MIT 24 Steps</small>
        <strong>{s.mit24.done}/{s.mit24.total} · {s.mit24.pct}%</strong>
        <span className="op-bar"><i style={{ width: `${s.mit24.pct}%` }} /></span>
        <span>{s.mit24.currentName ? `ถัดไป: ${s.mit24.currentName}` : 'ครบ 24 ขั้น'}</span>
      </button>
      <button className="op-card" onClick={() => go('health', 'marketing')}>
        <small>Measurement Health</small>
        <strong>{s.health.status === 'READY' ? 'พร้อมวินิจฉัย' : 'ข้อมูลยังไม่พอ'}</strong>
        <span className="op-bar"><i style={{ width: `${Math.round((s.health.present / s.health.total) * 100)}%` }} /></span>
        <span>{s.health.present}/{s.health.total} สัญญาณ{s.health.missing.length ? ` · ขาด ${s.health.missing.join(', ')}` : ''}</span>
      </button>
      <button className="op-card" onClick={() => go('revenue', 'city')}>
        <small>รายได้ (บันทึกจริง)</small>
        <strong>{s.revenue.value === null ? 'ยังไม่มีข้อมูล' : `฿${s.revenue.value.toLocaleString('th-TH')}`}</strong>
        <span>{s.revenue.maturity === 'MEASURED' ? 'MEASURED · จากรายการการเงิน' : 'UNAVAILABLE · ยังไม่มีรายรับ'}</span>
      </button>
      <button className="op-card op-nba" onClick={() => go('nba', s.nextAction.goto)}>
        <small>Next Best Action</small>
        <strong>{s.nextAction.label}</strong>
        <span>{s.nextAction.reason}</span>
      </button>
      <div className="op-card" style={{ cursor: 'default', gridColumn: '1 / -1' }}>
        <small>ตัวเลขช่องทาง (นำเข้าเอง)</small>
        {s.channelKpis.length === 0
          ? <strong>ยังไม่มีข้อมูล · UNAVAILABLE</strong>
          : <strong>{s.channelKpis.map(k => `${k.metric} ${k.value.toLocaleString('th-TH')}`).join(' · ')}</strong>}
        <button className="mkt-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => go('metrics', 'marketing')}>
          {s.channelKpis.length === 0 ? 'นำเข้าตัวเลข' : 'จัดการ'}</button>
      </div>
    </section>
  );
}
