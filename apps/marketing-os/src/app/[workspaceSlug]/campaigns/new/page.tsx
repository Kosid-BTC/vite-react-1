import { createCampaignAction } from './actions';
import { getMarketingService } from '@/server/services';
import { CampaignWizard } from '@/components/CampaignWizard';
import { WIZARD_STEPS } from '@/lib/campaignWizard';

export default async function NewCampaignPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const service = await getMarketingService();
  const { strategy } = await service.getCampaignWizard(workspaceSlug);

  const brand = strategy.brands[0];
  if (!brand) {
    return (
      <main className="shell stack">
        <h1>ตั้งค่าแบรนด์ก่อนสร้างแคมเปญ</h1>
        <p className="muted">ระบบต้องรู้จักแบรนด์ กลุ่มเป้าหมาย และสิ่งที่อยากให้คนกด (CTA) ก่อน เพื่อไม่ให้ AI สร้างคอนเทนต์แบบไม่มีทิศทาง</p>
      </main>
    );
  }

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">สร้างแคมเปญ · 3 ขั้น</p>
        <h1>สร้างแคมเปญจากสมมติฐานที่วัดผลได้</h1>
        {/* ลำดับในคำอธิบาย = ลำดับขั้นจริงในฟอร์ม (มาจากค่าคงที่ตัวเดียวกัน) */}
        <p className="muted">{WIZARD_STEPS.join(' → ')} — ใช้เวลาประมาณ 3 นาที</p>
      </header>

      <CampaignWizard
        action={createCampaignAction}
        workspaceSlug={workspaceSlug}
        brandId={brand.id}
        audiences={strategy.audiences.map((a) => ({ id: a.id, name: a.name, hint: a.description }))}
        pillars={strategy.pillars.map((p) => ({ id: p.id, name: p.name, hint: p.promise }))}
        offers={strategy.offers.map((o) => ({ id: o.id, name: o.name, hint: o.description }))}
        ctas={strategy.ctas.map((c) => ({ id: c.id, name: c.label }))}
      />
    </main>
  );
}
