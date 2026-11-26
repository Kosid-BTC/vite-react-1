'use client';

import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { WIZARD_STEPS } from '@/lib/campaignWizard';

type Option = { id: string; name: string; hint?: string | null };

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  workspaceSlug: string;
  brandId: string;
  audiences: Option[];
  pillars: Option[];
  offers: Option[];
  ctas: Option[];
};


const OBJECTIVES = [
  { value: 'awareness', label: 'ให้คนรู้จัก', hint: 'ยังไม่มีใครรู้ว่าเรามีอยู่' },
  { value: 'interest', label: 'หาคนสนใจ', hint: 'อยากได้คนที่ขอข้อมูลเพิ่ม' },
  { value: 'first_customer', label: 'หาลูกค้ากลุ่มแรก', hint: 'ยังไม่เคยขายได้ / ขายได้น้อย' },
  { value: 'sales', label: 'เพิ่มยอดขาย', hint: 'ขายได้แล้ว อยากได้มากขึ้น' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  // Doherty: ตอบสนองทันทีที่กด กันกดซ้ำ
  return (
    <button className="primary" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? 'กำลังบันทึก…' : 'บันทึกแคมเปญ'}
    </button>
  );
}

export function CampaignWizard({ action, workspaceSlug, brandId, audiences, pillars, offers, ctas }: Props) {
  const [step, setStep] = useState(0);
  const stepRefs = useRef<(HTMLFieldSetElement | null)[]>([]);
  const noCta = ctas.length === 0;

  function stepIsValid(i: number) {
    const fs = stepRefs.current[i];
    if (!fs) return true;
    const fields = Array.from(fs.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea'));
    const invalid = fields.find((f) => !f.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return false;
    }
    return true;
  }

  function goNext() {
    if (stepIsValid(step)) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // ช่องบังคับในขั้นที่ซ่อนอยู่ เบราว์เซอร์จะชี้ไม่ได้ ⇒ พากลับไปขั้นที่ยังไม่ครบเอง
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      if (!stepRefs.current[i]) continue;
      const fs = stepRefs.current[i]!;
      const bad = Array.from(fs.querySelectorAll<HTMLInputElement>('input,select,textarea')).some((f) => !f.checkValidity());
      if (bad) {
        e.preventDefault();
        setStep(i);
        requestAnimationFrame(() => stepIsValid(i));
        return;
      }
    }
  }

  return (
    <form action={action} onSubmit={onSubmit} className="card stack" noValidate>
      <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
      <input type="hidden" name="brandId" value={brandId} />

      {/* Goal-Gradient: เห็นว่าอยู่ขั้นไหน เหลืออีกเท่าไร */}
      <ol className="wizard-progress" aria-label="ขั้นตอน">
        {WIZARD_STEPS.map((label, i) => (
          <li
            key={label}
            className={i < step ? 'is-done' : i === step ? 'is-current' : undefined}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="step-dot" aria-hidden="true">{i < step ? '✓' : i + 1}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      {/* ขั้น 1 — คุยกับใคร */}
      <fieldset ref={(el) => { stepRefs.current[0] = el; }} hidden={step !== 0} className="wizard-step">
        <legend><h2>1. คุยกับใคร?</h2></legend>

        <div className="field" role="radiogroup" aria-labelledby="aud-label">
          <span id="aud-label" className="field-label">กลุ่มเป้าหมาย <span className="req">*</span></span>
          <div className="choice-grid">
            {audiences.map((a, i) => (
              <label key={a.id} className="choice">
                <input type="radio" name="audienceSegmentId" value={a.id} required={i === 0} />
                <span className="choice-body">
                  <strong>{a.name}</strong>
                  {a.hint && <small className="muted">{a.hint}</small>}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="field" role="radiogroup" aria-labelledby="obj-label">
          <span id="obj-label" className="field-label">อยากให้เขาทำอะไร (เป้าหมายหลัก) <span className="req">*</span></span>
          <div className="choice-grid">
            {OBJECTIVES.map((o) => (
              <label key={o.value} className="choice">
                <input type="radio" name="objective" value={o.value} defaultChecked={o.value === 'interest'} required />
                <span className="choice-body">
                  <strong>{o.label}</strong>
                  <small className="muted">{o.hint}</small>
                </span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* ขั้น 2 — พูดอะไร */}
      <fieldset ref={(el) => { stepRefs.current[1] = el; }} hidden={step !== 1} className="wizard-step">
        <legend><h2>2. พูดอะไร?</h2></legend>

        <label className="field">
          <span className="field-label">สารหลักที่จะสื่อ <span className="muted">(Message Pillar · ไม่บังคับ)</span></span>
          <small className="help">เรื่องที่อยากให้คนจำได้ เช่น &ldquo;ลองก่อนลงทุน&rdquo; ถ้ายังไม่แน่ใจ ข้ามได้</small>
          <select name="messagePillarId" defaultValue="">
            <option value="">ยังไม่เลือก — ให้ AI ช่วยเลือกภายหลัง</option>
            {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span className="field-label">สิ่งที่อยากให้คนกด <span className="muted">(CTA)</span> <span className="req">*</span></span>
          <small className="help">ปุ่มหรือการกระทำเดียวที่อยากให้คนทำหลังเห็นคอนเทนต์</small>
          {noCta ? (
            <p className="notice" role="status">
              ยังไม่มี CTA ในระบบ จึงยังบันทึกแคมเปญไม่ได้ — ต้องให้ผู้ดูแลเพิ่ม CTA ให้ workspace นี้ก่อน
            </p>
          ) : (
            <select name="ctaId" required defaultValue="">
              <option value="" disabled>เลือก CTA</option>
              {ctas.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </label>

        <details className="more">
          <summary>ตัวเลือกเพิ่มเติม</summary>
          <label className="field">
            <span className="field-label">ข้อเสนอ <span className="muted">(Offer · ไม่บังคับ)</span></span>
            <small className="help">สิ่งที่ให้เพื่อแลกกับการกด เช่น ทดลองฟรี / เช็กไอเดียฟรี</small>
            <select name="offerId" defaultValue="">
              <option value="">ยังไม่ผูกข้อเสนอ</option>
              {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        </details>
      </fieldset>

      {/* ขั้น 3 — วัดผลยังไง */}
      <fieldset ref={(el) => { stepRefs.current[2] = el; }} hidden={step !== 2} className="wizard-step">
        <legend><h2>3. วัดผลยังไง?</h2></legend>

        <label className="field">
          <span className="field-label">สมมติฐานที่จะทดสอบ <span className="muted">(Hypothesis)</span> <span className="req">*</span></span>
          <small className="help">เขียนเป็นประโยค &ldquo;กลุ่ม __ จะตอบสนองต่อ __ มากกว่า __&rdquo; (อย่างน้อย 12 ตัวอักษร)</small>
          <textarea name="hypothesis" required minLength={12} maxLength={1200} placeholder="เช่น คนทำงานประจำที่อยากเพิ่มรายได้จะตอบสนองต่อข้อความ ‘ก่อนลงทุน ลองรู้ก่อนว่าใครจะซื้อ’ มากกว่าข้อความที่นำด้วย AI" />
        </label>

        <label className="field">
          <span className="field-label">สัญญาณที่คาดว่าจะเห็น <span className="muted">(Expected signal · ไม่บังคับ)</span></span>
          <small className="help">ถ้าสมมติฐานถูก เราจะเห็นอะไร</small>
          <textarea name="expectedSignal" maxLength={600} placeholder="เช่น มีคนกด CTA และเริ่ม Idea Check" />
        </label>

        <label className="field">
          <span className="field-label">เกณฑ์ตัดสินใจ <span className="muted">(Decision rule · ไม่บังคับ)</span></span>
          <small className="help">ตัวเลขแค่ไหนถึงจะสรุปว่าได้ผล — อย่ารีบสรุปเมื่อจำนวนคนยังน้อย</small>
          <textarea name="decisionRule" maxLength={600} placeholder="เช่น ถ้ามีคนเห็นครบ 300 คน แล้วกด CTA ต่ำกว่า 1% ให้เปลี่ยนสาร" />
        </label>

        <label className="field">
          <span className="field-label">ตั้งชื่อแคมเปญ <span className="req">*</span></span>
          <input name="name" required minLength={3} maxLength={120} placeholder="เช่น เริ่มธุรกิจเสริมโดยไม่เสี่ยงก้อนใหญ่" />
        </label>
      </fieldset>

      <div className="actions wizard-nav">
        {step > 0 && (
          <button type="button" className="secondary" onClick={() => setStep((s) => s - 1)}>← ย้อนกลับ</button>
        )}
        {step < WIZARD_STEPS.length - 1 ? (
          <button
            type="button"
            className="primary"
            onClick={goNext}
            disabled={step === 1 && noCta}
          >
            ถัดไป: {WIZARD_STEPS[step + 1]} →
          </button>
        ) : (
          <SubmitButton />
        )}
      </div>
    </form>
  );
}
