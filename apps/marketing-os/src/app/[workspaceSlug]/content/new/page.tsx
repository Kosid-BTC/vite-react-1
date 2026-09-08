import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createContentAction } from './actions';

type NewContentPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function NewContentPage({ params }: NewContentPageProps) {
  const { workspaceSlug } = await params;
  const db = await createSupabaseServerClient();
  const workspaceResult = await db.from('workspaces').select('id,name,slug').eq('slug', workspaceSlug).maybeSingle();

  if (workspaceResult.error || !workspaceResult.data) {
    return (
      <main className="shell stack" style={{ maxWidth: 920, paddingTop: 40 }}>
        <h1>Create Content</h1>
        <div className="card" style={{ padding: 16 }}>
          <strong>Data status: UNAVAILABLE</strong>
          <p className="muted" style={{ marginBottom: 0 }}>{workspaceResult.error?.message ?? 'ไม่พบ Workspace'}</p>
        </div>
      </main>
    );
  }

  const workspace = workspaceResult.data;
  const [brands, campaigns, audiences, pillars, offers, ctas] = await Promise.all([
    db.from('marketing_brands').select('id,name').eq('workspace_id', workspace.id).order('created_at'),
    db.from('marketing_campaigns').select('id,name,status').eq('workspace_id', workspace.id).order('created_at', { ascending: false }),
    db.from('marketing_audience_segments').select('id,name').eq('workspace_id', workspace.id).eq('active', true).order('created_at'),
    db.from('marketing_message_pillars').select('id,name').eq('workspace_id', workspace.id).eq('active', true).order('priority', { ascending: false }),
    db.from('marketing_offers').select('id,name').eq('workspace_id', workspace.id).eq('active', true).order('created_at'),
    db.from('marketing_ctas').select('id,label').eq('workspace_id', workspace.id).eq('active', true).order('created_at'),
  ]);

  const firstError = [brands, campaigns, audiences, pillars, offers, ctas].find((result) => result.error)?.error;
  if (firstError) {
    return (
      <main className="shell stack" style={{ maxWidth: 920, paddingTop: 40 }}>
        <h1>Create Content</h1>
        <div className="card" style={{ padding: 16 }}>
          <strong>Data status: UNAVAILABLE</strong>
          <p className="muted" style={{ marginBottom: 0 }}>{firstError.message}</p>
        </div>
      </main>
    );
  }

  const brandList = brands.data ?? [];
  if (brandList.length === 0) {
    return (
      <main className="shell stack" style={{ maxWidth: 920, paddingTop: 40, paddingBottom: 56 }}>
        <p className="eyebrow">Content Factory</p>
        <h1 style={{ margin: 0 }}>Create Content</h1>
        <div className="card" style={{ padding: 18 }}>
          <strong>Setup status: NEED SETUP</strong>
          <p className="muted" style={{ marginBottom: 0 }}>ต้องมี Brand จริงก่อนสร้าง Content Object</p>
        </div>
        <Link className="primary" href={`/${workspaceSlug}/strategy/setup`}>เปิด Strategy Setup</Link>
      </main>
    );
  }

  return (
    <main className="shell stack" style={{ maxWidth: 980, paddingTop: 40, paddingBottom: 64, gap: 20 }}>
      <header className="stack" style={{ gap: 8 }}>
        <p className="eyebrow">Content Factory</p>
        <h1 style={{ margin: 0 }}>Create Content</h1>
        <p className="muted" style={{ margin: 0 }}>
          {workspace.name} · สร้าง Content Object ก่อน แล้วค่อยสร้าง Version / Asset / Approval / Tracking ภายใต้ Object เดียวกัน
        </p>
      </header>

      <form action={createContentAction} className="card stack" style={{ gap: 12, padding: 18 }}>
        <input type="hidden" name="workspaceSlug" value={workspaceSlug} />

        <label className="field">
          <span>Brand</span>
          <select name="brandId" required>{brandList.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        </label>

        <label className="field">
          <span>Campaign (optional)</span>
          <select name="campaignId" defaultValue="">
            <option value="">ไม่ผูก Campaign</option>
            {(campaigns.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.status}</option>)}
          </select>
        </label>

        <label className="field">
          <span>ชื่อ Content</span>
          <input name="title" required minLength={3} maxLength={180} placeholder="เช่น 3 เหตุผลที่ SME ควรเริ่มจากระบบก่อนยิงแอด" />
        </label>

        <label className="field">
          <span>Content type</span>
          <select name="contentType" defaultValue="short_video" required>
            <option value="short_video">Short video</option>
            <option value="long_video">Long video</option>
            <option value="image">Image</option>
            <option value="carousel">Carousel</option>
            <option value="post">Post</option>
            <option value="article">Article</option>
            <option value="email">Email</option>
            <option value="ad">Ad</option>
          </select>
        </label>

        <label className="field">
          <span>Funnel stage</span>
          <select name="funnelStage" defaultValue="">
            <option value="">ยังไม่ระบุ</option>
            <option value="awareness">Awareness</option>
            <option value="consideration">Consideration</option>
            <option value="intent">Intent</option>
            <option value="conversion">Conversion</option>
            <option value="retention">Retention</option>
          </select>
        </label>

        <label className="field">
          <span>Primary channel</span>
          <input name="primaryChannel" maxLength={80} placeholder="Facebook / YouTube / Website / Email" />
        </label>

        <label className="field">
          <span>Audience</span>
          <select name="audienceSegmentId" defaultValue="">
            <option value="">ยังไม่ผูก Audience</option>
            {(audiences.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Message Pillar</span>
          <select name="messagePillarId" defaultValue="">
            <option value="">ยังไม่ผูก Message Pillar</option>
            {(pillars.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Offer</span>
          <select name="offerId" defaultValue="">
            <option value="">ยังไม่ผูก Offer</option>
            {(offers.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>

        <label className="field">
          <span>CTA</span>
          <select name="ctaId" defaultValue="">
            <option value="">ยังไม่ผูก CTA</option>
            {(ctas.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>

        <button className="primary" type="submit">สร้าง Content Object</button>
      </form>

      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Link href={`/${workspaceSlug}/feature/content-items`}>ดู Content Items</Link>
        <Link href={`/${workspaceSlug}/home`}>กลับ Dashboard</Link>
      </nav>
    </main>
  );
}
