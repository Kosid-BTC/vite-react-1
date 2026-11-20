import { useState } from 'react';
import type { AppData } from '../types';
import { buildTrackedUrl, type TrackedLink } from '../lib/utm';
import { track } from '../lib/analytics';

/** สร้างลิงก์ติดตาม UTM + lineage ต่อแคมเปญ (Phase B) — ลิงก์ที่สร้างแล้วเป็นสัญญาณ utm ใน Measurement Health */
export default function UtmBuilder({ data, onUpdate }: { data: AppData; onUpdate: (d: AppData) => void }) {
  const mkt = data.marketing;
  const campaigns = mkt.campaigns ?? [];
  const channels = mkt.channels ?? [];
  const links = mkt.utmLinks ?? [];
  const [cid, setCid] = useState(campaigns[0]?.id ?? '');
  const [base, setBase] = useState('https://ceoaithailand.org/start');
  const [variant, setVariant] = useState('a');
  const [lp, setLp] = useState('start');
  const [cta, setCta] = useState('primary');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');

  const cp = campaigns.find(c => c.id === cid);
  const ch = channels.find(c => c.id === cp?.channelId);

  function create() {
    if (!cp) { setErr('เลือกแคมเปญก่อน (สร้างได้ในแท็บ "แคมเปญ")'); return; }
    const r = buildTrackedUrl({
      baseUrl: base.trim(), campaignId: cp.id, campaignName: cp.name, channelType: ch?.type ?? 'content',
      variantId: variant.trim(), landingPageId: lp.trim(), ctaId: cta.trim(),
    });
    if ('error' in r) { setErr(r.error); return; }
    setErr('');
    const link: TrackedLink = { id: `utm_${Date.now().toString(36)}`, campaignId: cp.id, url: r.url, createdAt: new Date().toISOString(), lineage: r.lineage };
    onUpdate({ ...data, marketing: { ...mkt, utmLinks: [link, ...links] } });
    track('utm_link_created', { channel: ch?.type ?? 'content' });
  }
  function copy(l: TrackedLink) {
    try { void navigator.clipboard.writeText(l.url); setCopied(l.id); } catch { /* noop */ }
  }
  function del(id: string) { onUpdate({ ...data, marketing: { ...mkt, utmLinks: links.filter(l => l.id !== id) } }); }

  return (
    <div className="mkt-section">
      <div className="mkt-sec-title">🔗 UTM & Tracking</div>
      <p className="mkt-empty" style={{ padding: '8px 0', textAlign: 'left' }}>
        ลิงก์แต่ละเส้นผูก แคมเปญ → ตัวแปร → หน้าปลายทาง → CTA เพื่อให้ GA4 ระบุได้ว่าลูกค้ามาจากไหน (เก็บเฉพาะแท็กแคมเปญ ไม่เก็บข้อมูลส่วนตัว)
      </p>
      {campaigns.length === 0 ? <div className="mkt-empty">ยังไม่มีแคมเปญ — สร้างในแท็บ "แคมเปญ" ก่อน</div> : (
        <div className="mkt-settings-grid">
          <div className="mkt-form-row"><label>แคมเปญ</label>
            <select className="mkt-inp" value={cid} onChange={e => setCid(e.target.value)}>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="mkt-form-row"><label>URL ปลายทาง</label>
            <input className="mkt-inp" value={base} onChange={e => setBase(e.target.value)} /></div>
          <div className="mkt-form-row"><label>ตัวแปร (variant)</label>
            <input className="mkt-inp" value={variant} onChange={e => setVariant(e.target.value)} /></div>
          <div className="mkt-form-row"><label>หน้าปลายทาง (landing id)</label>
            <input className="mkt-inp" value={lp} onChange={e => setLp(e.target.value)} /></div>
          <div className="mkt-form-row"><label>CTA id</label>
            <input className="mkt-inp" value={cta} onChange={e => setCta(e.target.value)} /></div>
          <div className="mkt-form-row"><label>&nbsp;</label>
            <button className="mkt-btn-sm" onClick={create}>สร้างลิงก์ติดตาม</button></div>
        </div>
      )}
      {err && <div className="pl-msg" role="alert">{err}</div>}
      {links.map(l => (
        <div key={l.id} className="mkt-goal-card" style={{ marginTop: 10 }}>
          <div style={{ wordBreak: 'break-all', fontSize: 12.5 }}>{l.url}</div>
          <div className="mkt-goal-actions" style={{ marginTop: 8 }}>
            <button className="mkt-btn-sm" onClick={() => copy(l)}>{copied === l.id ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}</button>
            <button className="mkt-btn-sm mkt-btn-del" onClick={() => del(l.id)}>ลบ</button>
          </div>
        </div>
      ))}
    </div>
  );
}
