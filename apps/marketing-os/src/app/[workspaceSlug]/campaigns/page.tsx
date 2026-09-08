import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type CampaignsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ visualQa?: string | string[] }>;
};

export default async function CampaignsPage({ params, searchParams }: CampaignsPageProps) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const visualQaToken = Array.isArray(query.visualQa) ? query.visualQa[0] : query.visualQa;
  const isPreviewVisualQa =
    workspaceSlug === 'visual-qa' &&
    process.env.VERCEL_ENV === 'preview' &&
    Boolean(process.env.VERCEL_GIT_COMMIT_SHA) &&
    visualQaToken === process.env.VERCEL_GIT_COMMIT_SHA;
  const suffix = visualQaToken ? `?visualQa=${encodeURIComponent(visualQaToken)}` : '';

  if (isPreviewVisualQa) {
    return (
      <main className="shell" style={{ maxWidth: 920, paddingTop: 40, paddingBottom: 56 }}>
        <section className="card stack" style={{ gap: 20 }}>
          <header className="stack" style={{ gap: 8 }}>
            <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
            <h1 style={{ margin: 0 }}>Campaigns</h1>
            <p className="muted" style={{ margin: 0 }}>Deterministic Preview fixture สำหรับ interaction / visual QA</p>
          </header>
          <div className="card" style={{ padding: 16 }}>
            <strong>Backend execution status: UNVERIFIED</strong>
          </div>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} aria-label="Campaign actions">
            <Link className="primary" href={`/${workspaceSlug}/campaigns/new${suffix}`}>สร้าง Campaign ใหม่</Link>
            <Link href={`/${workspaceSlug}/home${suffix}`}>กลับ Dashboard</Link>
          </nav>
        </section>
      </main>
    );
  }

  const db = await createSupabaseServerClient();
  const workspaceResult = await db
    .from('workspaces')
    .select('id,name,slug')
    .eq('slug', workspaceSlug)
    .maybeSingle();

  if (workspaceResult.error || !workspaceResult.data) {
    return (
      <main className="shell stack" style={{ maxWidth: 920, paddingTop: 40 }}>
        <h1>Campaigns</h1>
        <div className="card" style={{ padding: 16 }}>
          <strong>Data status: UNAVAILABLE</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            {workspaceResult.error?.message ?? 'ไม่พบ Workspace ที่ผู้ใช้มีสิทธิ์เข้าถึง'}
          </p>
        </div>
        <Link href={`/${workspaceSlug}/home`}>← กลับ Dashboard</Link>
      </main>
    );
  }

  const workspace = workspaceResult.data;
  const campaignsResult = await db
    .from('marketing_campaigns')
    .select('id,name,objective,status,starts_at,ends_at,created_at,updated_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <main className="shell" style={{ maxWidth: 1040, paddingTop: 40, paddingBottom: 56 }}>
      <section className="card stack" style={{ gap: 20 }}>
        <header className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1 style={{ margin: 0 }}>Campaigns</h1>
          <p className="muted" style={{ margin: 0 }}>{workspace.name} · Supabase workspace/RLS scoped</p>
        </header>

        {campaignsResult.error ? (
          <div className="card" style={{ padding: 16 }}>
            <strong>Data status: UNAVAILABLE</strong>
            <p className="muted" style={{ marginBottom: 0 }}>{campaignsResult.error.message}</p>
          </div>
        ) : (campaignsResult.data ?? []).length === 0 ? (
          <div className="card" style={{ padding: 20 }}>
            <strong>Data status: EMPTY</strong>
            <p className="muted" style={{ marginBottom: 0 }}>
              ยังไม่มี Campaign จริงใน Workspace นี้ ระบบจะไม่สร้าง Campaign ตัวอย่างเพื่อเติม Dashboard
            </p>
          </div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {(campaignsResult.data ?? []).map((campaign) => (
              <Link key={campaign.id} href={`/${workspaceSlug}/campaigns/${campaign.id}`} className="card" style={{ padding: 16, textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div className="stack" style={{ gap: 4 }}>
                    <strong>{campaign.name}</strong>
                    <span className="muted">Objective: {campaign.objective}</span>
                    <small className="muted">
                      Created {new Date(campaign.created_at).toLocaleString('th-TH')}
                      {campaign.starts_at ? ` · Start ${new Date(campaign.starts_at).toLocaleString('th-TH')}` : ''}
                      {campaign.ends_at ? ` · End ${new Date(campaign.ends_at).toLocaleString('th-TH')}` : ''}
                    </small>
                  </div>
                  <span className="eyebrow">{campaign.status.toUpperCase()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} aria-label="Campaign actions">
          <Link className="primary" href={`/${workspaceSlug}/campaigns/new`}>สร้าง Campaign ใหม่</Link>
          <Link href={`/${workspaceSlug}/home`}>กลับ Dashboard</Link>
        </nav>
      </section>
    </main>
  );
}
