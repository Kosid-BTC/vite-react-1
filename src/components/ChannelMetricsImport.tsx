import { useState } from 'react';
import type { AppData } from '../types';
import { PROVIDERS, importMetrics, latestByMetric, type ChannelProvider } from '../lib/channelMetrics';
import { track } from '../lib/analytics';

const LIVE: ChannelProvider[] = ['ga4', 'youtube', 'meta'];

/** นำเข้าตัวเลขช่องทาง (Phase D) — วาง JSON ดิบจาก GA4/YouTube/Meta → normalize → Dashboard
 *  ตัวดึงอัตโนมัติ (OAuth) ยังปิดอยู่ · TikTok/LinkedIn ยังไม่รองรับ */
export default function ChannelMetricsImport({ data, onUpdate }: { data: AppData; onUpdate: (d: AppData) => void }) {
  const records = data.channelMetrics ?? [];
  const [provider, setProvider] = useState<ChannelProvider>('ga4');
  const [text, setText] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [msg, setMsg] = useState('');
  const latest = latestByMetric(records);

  function submit() {
    const r = importMetrics(provider, text, { start: start || undefined, end: end || undefined });
    if (!r.ok) { setMsg(r.reason); return; }
    onUpdate({ ...data, channelMetrics: [...r.records, ...records] });
    setText(''); setMsg(`นำเข้า ${r.records.length} ตัวชี้วัดแล้ว`);
    track('channel_metrics_imported', { provider });
  }

  return (
    <div className="mkt-section">
      <div className="mkt-sec-title">📈 ตัวเลขช่องทาง</div>
      <p className="mkt-empty" style={{ padding: '8px 0', textAlign: 'left' }}>
        วางผลลัพธ์ดิบจากแพลตฟอร์ม ระบบแปลงเป็นตัวเลขมาตรฐานและแสดงบน Dashboard พร้อมแหล่งที่มา (ยังไม่มีการดึงอัตโนมัติ — ต้องเชื่อม OAuth ของบัญชีคุณเอง)
      </p>
      <div className="mkt-settings-grid">
        <div className="mkt-form-row"><label>แพลตฟอร์ม</label>
          <select className="mkt-inp" value={provider} onChange={e => setProvider(e.target.value as ChannelProvider)}>
            {LIVE.map(p => <option key={p} value={p}>{PROVIDERS[p].label}</option>)}
          </select></div>
        <div className="mkt-form-row"><label>ช่วงเวลา (เริ่ม)</label><input type="date" className="mkt-inp" value={start} onChange={e => setStart(e.target.value)} /></div>
        <div className="mkt-form-row"><label>ช่วงเวลา (สิ้นสุด)</label><input type="date" className="mkt-inp" value={end} onChange={e => setEnd(e.target.value)} /></div>
      </div>
      <div className="mkt-empty" style={{ padding: '0 0 8px', textAlign: 'left' }}>{PROVIDERS[provider].hint}</div>
      <textarea className="mkt-inp" rows={6} value={text} onChange={e => setText(e.target.value)} placeholder="วาง JSON ที่นี่" />
      <button className="mkt-btn-sm" style={{ marginTop: 8 }} onClick={submit}>นำเข้า</button>
      <div className="mkt-empty" style={{ padding: '6px 0', textAlign: 'left' }}>
        TikTok · LinkedIn: ยังไม่รองรับ (planned)
      </div>
      {msg && <div className="pl-msg" role="status">{msg}</div>}
      {Object.values(latest).map(r => r && (
        <div key={r.metric} className="mkt-goal-card" style={{ marginTop: 8 }}>
          <b>{r.metric}</b> {r.value.toLocaleString('th-TH')} · {PROVIDERS[r.provider].label}
          {r.periodStart ? ` · ${r.periodStart}${r.periodEnd ? `–${r.periodEnd}` : ''}` : ''} · นำเข้าเอง
          <button className="mkt-btn-sm mkt-btn-del" style={{ marginLeft: 8 }}
            onClick={() => onUpdate({ ...data, channelMetrics: records.filter(x => x.id !== r.id) })}>ลบ</button>
        </div>
      ))}
    </div>
  );
}
