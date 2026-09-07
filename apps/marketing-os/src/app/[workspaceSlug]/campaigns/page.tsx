import Link from 'next/link';

type CampaignsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ visualQa?: string | string[] }>;
};

export default async function CampaignsPage({ params, searchParams }: CampaignsPageProps) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const visualQaToken = Array.isArray(query.visualQa) ? query.visualQa[0] : query.visualQa;
  const suffix = visualQaToken ? `?visualQa=${encodeURIComponent(visualQaToken)}` : '';

  return (
    <main className="shell" style={{ maxWidth: 920, paddingTop: 40, paddingBottom: 56 }}>
      <section className="card stack" style={{ gap: 20 }}>
        <header className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1 style={{ margin: 0 }}>Campaigns</h1>
          <p className="muted" style={{ margin: 0 }}>Campaign workspace พร้อมสำหรับการสร้างสมมติฐานและวัดผล</p>
        </header>
        <div className="card" style={{ padding: 16 }}>
          <strong>Backend execution status: UNVERIFIED</strong>
          <p className="muted" style={{ marginBottom: 0 }}>รายการ Campaign จาก Production ยังไม่ถูกอ้างว่า verified จนกว่าจะผ่าน authenticated data-flow gate</p>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} aria-label="Campaign actions">
          <Link className="primary" href={`/${workspaceSlug}/campaigns/new${suffix}`}>สร้าง Campaign ใหม่</Link>
          <Link href={`/${workspaceSlug}/home${suffix}`}>กลับ Dashboard</Link>
        </nav>
      </section>
    </main>
  );
}
