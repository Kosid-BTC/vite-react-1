import Link from 'next/link';
import { createCampaignAction } from './actions';
import { getMarketingService } from '@/server/services';

type NewCampaignPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ visualQa?: string | string[] }>;
};

export default async function NewCampaignPage({ params, searchParams }: NewCampaignPageProps) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const visualQaToken = Array.isArray(query.visualQa) ? query.visualQa[0] : query.visualQa;
  const isPreviewVisualQa =
    process.env.VERCEL_ENV === 'preview' &&
    Boolean(process.env.VERCEL_GIT_COMMIT_SHA) &&
    visualQaToken === process.env.VERCEL_GIT_COMMIT_SHA;
  const strategy = isPreviewVisualQa
    ? {
        brands: [{ id: '00000000-0000-4000-8000-000000000001', name: 'CEO AI Thailand' }],
        audiences: [{ id: '00000000-0000-4000-8000-000000000002', name: 'ผู้ประกอบการ SME ไทย' }],
        pillars: [{ id: '00000000-0000-4000-8000-000000000003', name: 'Business Growth' }],
        offers: [{ id: '00000000-0000-4000-8000-000000000004', name: 'Marketing OS Pilot' }],
        ctas: [{ id: '00000000-0000-4000-8000-000000000005', label: 'เริ่มวางแผน Campaign' }],
      }
    : (await (await getMarketingService()).getCampaignWizard(workspaceSlug)).strategy;

  const brand = strategy.brands[0];
  const strategyReady = Boolean(brand && strategy.audiences.length > 0 && strategy.ctas.length > 0);

  if (!strategyReady) {
    return (
      <main className="shell stack" style={{ maxWidth: 920, paddingTop: 40, paddingBottom: 56 }}>
        <header className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">Campaign Wizard</p>
          <h1 style={{ margin: 0 }}>ตั้งค่า Strategy ก่อนสร้าง Campaign</h1>
          <p className="muted" style={{ margin: 0 }}>
            ต้องมีอย่างน้อย Brand + Audience + CTA จริง เพื่อไม่ให้ AI สร้าง Campaign แบบไม่มีบริบท
          </p>
        </header>
        <div className="card" style={{ padding: 18 }}>
          <strong>Setup status: NEED SETUP</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Brand {strategy.brands.length} · Audience {strategy.audiences.length} · CTA {strategy.ctas.length}
          </p>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link className="primary" href={`/${workspaceSlug}/strategy/setup`}>เปิด Strategy Setup</Link>
          <Link href={`/${workspaceSlug}/home`}>กลับ Dashboard</Link>
        </nav>
      </main>
    );
  }

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">Campaign Wizard</p>
        <h1>สร้าง Campaign จากสมมติฐานที่วัดผลได้</h1>
        <p className="muted">เลือกกลุ่มเป้าหมาย → เป้าหมาย → สาร → CTA แล้วกำหนดสิ่งที่คาดว่าจะเกิดขึ้น</p>
      </header>

      <div className="card" style={{ padding: 14 }}>
        <strong>Strategy status: READY</strong>
        <p className="muted" style={{ marginBottom: 0 }}>
          {strategy.brands.length} Brand · {strategy.audiences.length} Audience · {strategy.pillars.length} Pillar · {strategy.offers.length} Offer · {strategy.ctas.length} CTA
        </p>
      </div>

      <form action={isPreviewVisualQa ? undefined : createCampaignAction} className="card stack" data-visual-qa={isPreviewVisualQa ? 'campaign-form' : undefined}>
        <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
        <input type="hidden" name="brandId" value={brand!.id} />

        <label className="field">
          <span>ชื่อ Campaign</span>
          <input name="name" required minLength={3} maxLength={120} placeholder="เช่น เริ่มธุรกิจเสริมโดยไม่เสี่ยงก้อนใหญ่" />
        </label>

        <label className="field">
          <span>เป้าหมายหลัก</span>
          <select name="objective" required defaultValue="interest">
            <option value="awareness">ให้คนรู้จัก</option>
            <option value="interest">หาคนสนใจ</option>
            <option value="first_customer">หาลูกค้ากลุ่มแรก</option>
            <option value="sales">สร้างยอดขาย</option>
          </select>
        </label>

        <label className="field">
          <span>พูดกับใคร?</span>
          <select name="audienceSegmentId" required defaultValue="">
            <option value="" disabled>เลือกกลุ่มเป้าหมาย</option>
            {strategy.audiences.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Message Pillar</span>
          <select name="messagePillarId" defaultValue="">
            <option value="">ยังไม่ผูก Message Pillar</option>
            {strategy.pillars.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Offer</span>
          <select name="offerId" defaultValue="">
            <option value="">ยังไม่ผูก Offer</option>
            {strategy.offers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>CTA</span>
          <select name="ctaId" required defaultValue="">
            <option value="" disabled>เลือก CTA</option>
            {strategy.ctas.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Hypothesis ที่ต้องการทดสอบ</span>
          <textarea name="hypothesis" required minLength={12} maxLength={1200} placeholder="เช่น กลุ่มเป้าหมายจะตอบสนองต่อข้อความแบบใด และเพราะอะไร" />
        </label>

        <label className="field">
          <span>Expected signal</span>
          <textarea name="expectedSignal" maxLength={600} placeholder="เช่น มีคนกด CTA และเริ่ม Idea Check" />
        </label>

        <label className="field">
          <span>Decision rule</span>
          <textarea name="decisionRule" maxLength={600} placeholder="ระบุเงื่อนไขที่จะใช้ตัดสิน โดยไม่รีบสรุปเมื่อ sample ยังไม่พอ" />
        </label>

        <button className="primary" type={isPreviewVisualQa ? 'button' : 'submit'}>สร้าง Campaign</button>
        {isPreviewVisualQa && <p className="muted">Backend execution status: UNVERIFIED — Preview QA does not write Production data.</p>}
      </form>

      {!isPreviewVisualQa && <Link href={`/${workspaceSlug}/strategy/setup`}>แก้ Strategy Setup</Link>}
    </main>
  );
}
