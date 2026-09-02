import Link from 'next/link';

export default async function CampaignPage({ params }: { params: Promise<{ workspaceSlug: string; campaignId: string }> }) {
  const { workspaceSlug, campaignId } = await params;

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">Campaign created</p>
        <h1>Campaign พร้อมสำหรับขั้น Content</h1>
        <p className="muted">ID: {campaignId}</p>
      </header>
      <section className="card stack">
        <h2>ขั้นต่อไป</h2>
        <p className="muted">สร้าง Content Item จาก Audience + Hypothesis ของ Campaign แล้วค่อยเข้าสู่ Text → Image → Approval → Tracking</p>
        <div className="actions">
          <Link className="primary" href={`/${workspaceSlug}/home`}>กลับ Action Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
