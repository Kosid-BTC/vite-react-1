import { useState, useRef, useEffect } from 'react';
import type { AppData, MarketingChannelType } from '../types';
import { checkGuardrails, newContentItem, transition, type ContentItem, type ContentStatus } from '../lib/contentLibrary';
import { track } from '../lib/analytics';
import { generateImage } from '../lib/contentImage';
import { startVideo, pollVideo, POLL_INTERVAL_MS, POLL_MAX_MS } from '../lib/contentVideo';
import { INTEGRATIONS } from '../config';

const STATUS_LABEL: Record<ContentStatus, string> = { draft: 'ร่าง', review: 'รออนุมัติ', approved: 'อนุมัติแล้ว', published: 'เผยแพร่แล้ว', rejected: 'ตีกลับ' };
const NEXT: Record<ContentStatus, { to: ContentStatus; label: string }[]> = {
  draft: [{ to: 'review', label: 'ส่งตรวจ' }],
  review: [{ to: 'approved', label: '✓ อนุมัติ' }, { to: 'rejected', label: 'ตีกลับ' }],
  approved: [{ to: 'published', label: 'ทำเครื่องหมายเผยแพร่แล้ว' }, { to: 'draft', label: 'แก้ไขใหม่' }],
  published: [],
  rejected: [{ to: 'draft', label: 'แก้ไขใหม่' }],
};
const CHANNELS: MarketingChannelType[] = ['social', 'content', 'email', 'seo', 'sem', 'referral', 'event', 'partner'];

/** Content Library + Approval (Phase C) — ทุกชิ้นผ่านด่าน guardrail ก่อนอนุมัติ/เผยแพร่ */
export default function ContentLibrary({ data, onUpdate }: { data: AppData; onUpdate: (d: AppData) => void }) {
  const items = data.contentLibrary ?? [];
  const campaigns = data.marketing.campaigns ?? [];
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<MarketingChannelType>('social');
  const [campaignId, setCampaignId] = useState('');
  const [msg, setMsg] = useState('');
  const [imgBusy, setImgBusy] = useState('');
  const [vidBusy, setVidBusy] = useState('');
  const [vids, setVids] = useState<Record<string, string>>({}); // URL วิดีโอร่าง (หมดอายุ — ให้ดาวน์โหลดเก็บ) ไม่เก็บใน AppData
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const [imgs, setImgs] = useState<Record<string, string>>({}); // ภาพร่างอยู่ในหน่วยความจำเท่านั้น ไม่เก็บใน AppData

  const save = (list: ContentItem[]) => onUpdate({ ...data, contentLibrary: list });
  function add() {
    if (!title.trim() || !body.trim()) { setMsg('กรอกหัวข้อและเนื้อหาก่อน'); return; }
    save([newContentItem({ title: title.trim(), body: body.trim(), channel, campaignId: campaignId || undefined }), ...items]);
    setTitle(''); setBody(''); setMsg('');
    track('content_item_created', { channel });
  }
  function move(it: ContentItem, to: ContentStatus) {
    const r = transition(it, to);
    if (!r.ok) { setMsg(`${it.title}: ${r.reason}`); return; }
    setMsg('');
    save(items.map(x => (x.id === it.id ? r.item : x)));
    track('content_status_changed', { to });
  }

  async function makeImage(it: ContentItem) {
    setImgBusy(it.id); setMsg('');
    const r = await generateImage(it.title, it.body);
    setImgBusy('');
    if (!r.ok) { setMsg(`${it.title}: ${r.reason}`); return; }
    setImgs(p => ({ ...p, [it.id]: r.dataUrl }));
    track('content_image_generated', { channel: it.channel });
  }

  async function makeVideo(it: ContentItem) {
    setVidBusy(it.id); setMsg('');
    const st = await startVideo(it);
    if (!st.ok) { setVidBusy(''); setMsg(`${it.title}: ${st.reason}`); return; }
    track('content_video_started', { channel: it.channel });
    setMsg(`${it.title}: กำลังสร้างวิดีโอ (ใช้เวลาประมาณ 1–3 นาที) · เหลือโควตาวันนี้ ${st.remaining} คลิป`);
    const t0 = Date.now();
    while (alive.current && Date.now() - t0 < POLL_MAX_MS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      if (!alive.current) return;
      const p = await pollVideo(st.statusUrl, st.responseUrl);
      if (!p.ok) { setVidBusy(''); setMsg(`${it.title}: ${p.reason}`); return; }
      if (p.status === 'COMPLETED' && p.videoUrl) {
        setVids(v => ({ ...v, [it.id]: p.videoUrl! })); setVidBusy(''); setMsg('');
        track('content_video_ready', { channel: it.channel });
        return;
      }
    }
    if (alive.current) { setVidBusy(''); setMsg(`${it.title}: วิดีโอยังไม่เสร็จภายในเวลาที่กำหนด ลองใหม่ภายหลัง`); }
  }

  return (
    <div className="mkt-section">
      <div className="mkt-sec-title">📚 คลังเนื้อหา & การอนุมัติ</div>
      <p className="mkt-empty" style={{ padding: '8px 0', textAlign: 'left' }}>
        ทุกชิ้นต้องผ่านด่าน brand guardrail (ราคา Starter ปัจจุบัน, ห้ามสัญญารายได้) ก่อนอนุมัติหรือเผยแพร่
      </p>
      <div className="mkt-settings-grid">
        <div className="mkt-form-row"><label>หัวข้อ</label><input className="mkt-inp" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="mkt-form-row"><label>ช่องทาง</label>
          <select className="mkt-inp" value={channel} onChange={e => setChannel(e.target.value as MarketingChannelType)}>
            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <div className="mkt-form-row"><label>แคมเปญ (ไม่บังคับ)</label>
          <select className="mkt-inp" value={campaignId} onChange={e => setCampaignId(e.target.value)}>
            <option value="">—</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
      </div>
      <div className="mkt-form-row"><label>เนื้อหา</label>
        <textarea className="mkt-inp" rows={4} value={body} onChange={e => setBody(e.target.value)} /></div>
      <button className="mkt-btn-sm" onClick={add}>เพิ่มเป็นร่าง</button>
      {msg && <div className="pl-msg" role="alert">{msg}</div>}
      {items.length === 0 && <div className="mkt-empty">ยังไม่มีเนื้อหาในคลัง</div>}
      {items.map(it => {
        const issues = checkGuardrails(it);
        return (
          <div key={it.id} className="mkt-goal-card" style={{ marginTop: 10 }}>
            <div className="mkt-goal-header">
              <div className="mkt-goal-metric">{it.title}</div>
              <span className="meta-chip">{STATUS_LABEL[it.status]}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', whiteSpace: 'pre-wrap' }}>{it.body}</div>
            {issues.length > 0 && it.status !== 'published' && (
              <div style={{ color: 'var(--amber)', fontSize: 12, marginTop: 6 }}>⚠ {issues.map(i => i.message).join(' · ')}</div>
            )}
            {imgs[it.id] && <img src={imgs[it.id]} alt="ภาพร่างที่ AI สร้าง — ตรวจก่อนใช้" style={{ maxWidth: 240, borderRadius: 8, marginTop: 8 }} />}
            {vids[it.id] && <video src={vids[it.id]} controls style={{ maxWidth: 320, borderRadius: 8, marginTop: 8, display: 'block' }} />}
            <div className="mkt-goal-actions" style={{ marginTop: 8 }}>
              {NEXT[it.status].map(n => <button key={n.to} className="mkt-btn-sm" onClick={() => move(it, n.to)}>{n.label}</button>)}
              <button className="mkt-btn-sm" disabled={!INTEGRATIONS.imageGenLive || imgBusy === it.id} onClick={() => makeImage(it)}
                title={INTEGRATIONS.imageGenLive ? 'สร้างภาพร่างจากหัวข้อ/เนื้อหา' : 'ยังไม่เปิดใช้งาน — รอตั้งค่าผู้ให้บริการภาพ'}>
                {imgBusy === it.id ? 'กำลังสร้าง…' : '🖼️ สร้างภาพ'}</button>
              <button className="mkt-btn-sm" disabled={!INTEGRATIONS.videoGenLive || it.status !== 'approved' || vidBusy === it.id} onClick={() => makeVideo(it)}
                title={!INTEGRATIONS.videoGenLive ? 'ยังไม่เปิดใช้งาน — รอตั้งค่าผู้ให้บริการวิดีโอ' : it.status !== 'approved' ? 'สร้างวิดีโอได้เฉพาะเนื้อหาที่อนุมัติแล้ว' : 'สร้างวิดีโอร่าง (จำกัดโควตา/วัน)'}>
                {vidBusy === it.id ? 'กำลังสร้าง…' : '🎬 สร้างวิดีโอ'}</button>
              <button className="mkt-btn-sm mkt-btn-del" onClick={() => save(items.filter(x => x.id !== it.id))}>ลบ</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
