import { createCampaignAction } from './actions';
import { getMarketingService } from '@/server/services';

export default async function NewCampaignPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const service = await getMarketingService();
  const { strategy } = await service.getCampaignWizard(workspaceSlug);

  const brand = strategy.brands[0];
  if (!brand) {
    return (
      <main className="shell stack">
        <h1>ตั้งค่า Brand ก่อนสร้าง Campaign</h1>
        <p className="muted">ระบบต้องรู้ Brand, Audience และ CTA ก่อน เพื่อไม่ให้ AI สร้างคอนเทนต์แบบไม่มีทิศทาง</p>
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

      <form action={createCampaignAction} className="card stack">
        <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
        <input type="hidden" name="brandId" value={brand.id} />

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
            <option value="">ให้ AI ช่วยเลือกภายหลัง</option>
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
          <textarea name="hypothesis" required minLength={12} maxLength={1200} placeholder="เช่น คนทำงานประจำที่อยากเพิ่มรายได้จะตอบสนองต่อข้อความ ‘ก่อนลงทุน ลองรู้ก่อนว่าใครจะซื้อ’ มากกว่าข้อความที่นำด้วย AI" />
        </label>

        <label className="field">
          <span>Expected signal</span>
          <textarea name="expectedSignal" maxLength={600} placeholder="เช่น มีคนกด CTA และเริ่ม Idea Check" />
        </label>

        <label className="field">
          <span>Decision rule</span>
          <textarea name="decisionRule" maxLength={600} placeholder="ระบุเงื่อนไขที่จะใช้ตัดสิน โดยไม่รีบสรุปเมื่อ sample ยังไม่พอ" />
        </label>

        <button className="primary" type="submit">สร้าง Campaign</button>
      </form>
    </main>
  );
}
