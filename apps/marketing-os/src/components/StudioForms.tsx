'use client';

import { useActionState } from 'react';
import {
  analyzeAction, decideAction, generateAdsAction, resolveFindingAction, type StudioState,
} from '@/app/[workspaceSlug]/studio/actions';

type Opt = { id: string; label: string; recommended?: boolean };

function Status({ state }: { state: StudioState }) {
  if (state.error) return <p className="notice" role="alert">{state.error}</p>;
  if (state.ok) return <p className="badge" role="status">✓ {state.ok}</p>;
  return null;
}

export function AnalyzeForm({ workspaceSlug }: { workspaceSlug: string }) {
  const [state, action, pending] = useActionState<StudioState, FormData>(analyzeAction, {});
  return (
    <form action={action} className="stack">
      <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
      <div className="actions">
        <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
          {pending ? 'กำลังวิเคราะห์… (ประมาณ 30–60 วินาที)' : 'วิเคราะห์ข้อมูลล่าสุด'}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

const CHANNELS = [
  { id: 'facebook', label: 'Facebook' }, { id: 'instagram', label: 'Instagram' }, { id: 'tiktok', label: 'TikTok' },
  { id: 'line', label: 'LINE' }, { id: 'youtube', label: 'YouTube' },
];
const OBJECTIVES = [
  { id: 'awareness', label: 'ให้คนรู้จัก' }, { id: 'interest', label: 'หาคนสนใจ' },
  { id: 'first_customer', label: 'หาลูกค้ากลุ่มแรก' }, { id: 'sales', label: 'เพิ่มยอดขาย' },
];

export function GenerateForm({ workspaceSlug, segments, pillars }: { workspaceSlug: string; segments: Opt[]; pillars: Opt[] }) {
  const [state, action, pending] = useActionState<StudioState, FormData>(generateAdsAction, {});
  const segDefault = segments.find((s) => s.recommended)?.id ?? '';
  const pilDefault = pillars.find((p) => p.recommended)?.id ?? '';
  return (
    <form action={action} className="stack">
      <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
      <div className="grid">
        <label className="field">
          <span className="field-label">พูดกับใคร <span className="req">*</span></span>
          <select name="segmentId" required defaultValue={segDefault}>
            <option value="" disabled>เลือกกลุ่มเป้าหมาย</option>
            {segments.map((s) => <option key={s.id} value={s.id}>{s.label}{s.recommended ? ' ★ AI แนะนำ' : ''}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">สารหลัก <span className="req">*</span></span>
          <select name="pillarId" required defaultValue={pilDefault}>
            <option value="" disabled>เลือกสารหลัก</option>
            {pillars.map((p) => <option key={p.id} value={p.id}>{p.label}{p.recommended ? ' ★ AI แนะนำ' : ''}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">ช่องทาง</span>
          <select name="channel" defaultValue="facebook">
            {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">เป้าหมาย</span>
          <select name="objective" defaultValue="interest">
            {OBJECTIVES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
      </div>
      <div className="actions">
        <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
          {pending ? 'AI กำลังเขียนและตรวจกฎแบรนด์… (1–3 นาที)' : 'สร้างร่างโฆษณา 3 แบบ'}
        </button>
      </div>
      <p className="help">AI เขียนร่าง → AI อีกตัวตรวจกฎแบรนด์ → บันทึกเป็น "รออนุมัติ" · ไม่มีอะไรถูกเผยแพร่จนกว่าคุณจะอนุมัติและโพสต์เอง</p>
      <Status state={state} />
    </form>
  );
}

export function DecisionForm({ workspaceSlug, contentId, approvalId, blocking }: {
  workspaceSlug: string; contentId: string; approvalId: string; blocking: number;
}) {
  const [state, action, pending] = useActionState<StudioState, FormData>(decideAction, {});
  return (
    <form action={action} className="stack">
      <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
      <input type="hidden" name="contentId" value={contentId} />
      <input type="hidden" name="approvalId" value={approvalId} />
      <label className="field">
        <span className="field-label">หมายเหตุ (ไม่บังคับ)</span>
        <textarea name="notes" maxLength={1000} style={{ minHeight: 70 }} />
      </label>
      <div className="actions">
        <button className="primary" name="decision" value="approved" type="submit" disabled={pending || blocking > 0}
          title={blocking > 0 ? 'ยังมีข้อห้ามเด็ดขาดที่ยังไม่แก้' : undefined}>
          ✓ อนุมัติ
        </button>
        <button className="secondary" name="decision" value="changes_requested" type="submit" disabled={pending}>ขอให้แก้</button>
        <button className="secondary" name="decision" value="rejected" type="submit" disabled={pending}>ไม่ใช้</button>
      </div>
      {blocking > 0 && <p className="help">อนุมัติได้หลังแก้ข้อห้ามเด็ดขาด {blocking} ข้อ แล้วกด &ldquo;แก้แล้ว&rdquo;</p>}
      <Status state={state} />
    </form>
  );
}

export function ResolveForm({ workspaceSlug, contentId, findingId }: { workspaceSlug: string; contentId: string; findingId: string }) {
  const [state, action, pending] = useActionState<StudioState, FormData>(resolveFindingAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
      <input type="hidden" name="contentId" value={contentId} />
      <input type="hidden" name="findingId" value={findingId} />
      <button className="secondary" type="submit" disabled={pending}>แก้แล้ว</button>
      {state.error && <span className="muted"> {state.error}</span>}
    </form>
  );
}
