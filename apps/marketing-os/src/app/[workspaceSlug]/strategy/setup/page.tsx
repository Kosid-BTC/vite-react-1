import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  createAudienceAction,
  createBrandAction,
  createBrandRuleAction,
  createCtaAction,
  createMessagePillarAction,
  createOfferAction,
} from './actions';

type StrategySetupPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function StrategySetupPage({ params }: StrategySetupPageProps) {
  const { workspaceSlug } = await params;
  const db = await createSupabaseServerClient();
  const workspaceResult = await db.from('workspaces').select('id,name,slug').eq('slug', workspaceSlug).maybeSingle();

  if (workspaceResult.error || !workspaceResult.data) {
    return (
      <main className="shell stack" style={{ maxWidth: 960, paddingTop: 40 }}>
        <h1>Strategy Setup</h1>
        <div className="card" style={{ padding: 16 }}>
          <strong>Data status: UNAVAILABLE</strong>
          <p className="muted" style={{ marginBottom: 0 }}>{workspaceResult.error?.message ?? 'ไม่พบ Workspace'}</p>
        </div>
      </main>
    );
  }

  const workspace = workspaceResult.data;
  const [brands, audiences, pillars, offers, ctas, rules] = await Promise.all([
    db.from('marketing_brands').select('id,name,website_url,positioning').eq('workspace_id', workspace.id).order('created_at'),
    db.from('marketing_audience_segments').select('id,name,code,active').eq('workspace_id', workspace.id).order('created_at'),
    db.from('marketing_message_pillars').select('id,name,code,priority,active').eq('workspace_id', workspace.id).order('priority', { ascending: false }),
    db.from('marketing_offers').select('id,name,code,active').eq('workspace_id', workspace.id).order('created_at'),
    db.from('marketing_ctas').select('id,label,code,action_type,active').eq('workspace_id', workspace.id).order('created_at'),
    db.from('marketing_brand_rules').select('id,description,severity,active').eq('workspace_id', workspace.id).order('created_at'),
  ]);

  const firstError = [brands, audiences, pillars, offers, ctas, rules].find((result) => result.error)?.error;
  if (firstError) {
    return (
      <main className="shell stack" style={{ maxWidth: 960, paddingTop: 40 }}>
        <h1>Strategy Setup</h1>
        <div className="card" style={{ padding: 16 }}>
          <strong>Data status: UNAVAILABLE</strong>
          <p className="muted" style={{ marginBottom: 0 }}>{firstError.message}</p>
        </div>
      </main>
    );
  }

  const brandList = brands.data ?? [];
  const hasBrand = brandList.length > 0;

  return (
    <main className="shell stack" style={{ maxWidth: 1180, paddingTop: 40, paddingBottom: 64, gap: 20 }}>
      <header className="stack" style={{ gap: 8 }}>
        <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
        <h1 style={{ margin: 0 }}>Strategy Setup</h1>
        <p className="muted" style={{ margin: 0 }}>
          {workspace.name} · ตั้งค่า Brand → Audience → Message → Offer → CTA → Guardrail ก่อนสร้าง Campaign
        </p>
      </header>

      <section className="card stack" style={{ gap: 12, padding: 18 }}>
        <strong>Setup status: {hasBrand && (audiences.data?.length ?? 0) > 0 && (ctas.data?.length ?? 0) > 0 ? 'READY FOR CAMPAIGN' : 'NEED SETUP'}</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
          {[
            ['Brands', brandList.length],
            ['Audiences', audiences.data?.length ?? 0],
            ['Message Pillars', pillars.data?.length ?? 0],
            ['Offers', offers.data?.length ?? 0],
            ['CTAs', ctas.data?.length ?? 0],
            ['Brand Rules', rules.data?.length ?? 0],
          ].map(([label, count]) => (
            <div key={String(label)} className="card" style={{ padding: 12 }}>
              <span className="muted">{label}</span>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{count}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card stack" style={{ gap: 14, padding: 18 }}>
        <div>
          <p className="eyebrow">1 · Brand</p>
          <h2 style={{ margin: 0 }}>เพิ่ม Brand</h2>
        </div>
        <form action={createBrandAction} className="stack" style={{ gap: 10 }}>
          <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
          <label className="field"><span>ชื่อ Brand</span><input name="name" required minLength={2} maxLength={120} /></label>
          <label className="field"><span>Website</span><input name="websiteUrl" type="url" placeholder="https://..." /></label>
          <label className="field"><span>Description</span><textarea name="description" maxLength={1200} /></label>
          <label className="field"><span>Positioning</span><textarea name="positioning" maxLength={1200} /></label>
          <button className="primary" type="submit">บันทึก Brand</button>
        </form>
        {brandList.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            {brandList.map((brand) => (
              <div key={brand.id} className="card" style={{ padding: 12 }}>
                <strong>{brand.name}</strong>
                <div className="muted">{brand.positioning ?? brand.website_url ?? 'ยังไม่มี positioning'}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card stack" style={{ gap: 14, padding: 18 }}>
        <div>
          <p className="eyebrow">2 · Audience</p>
          <h2 style={{ margin: 0 }}>เพิ่ม Audience Segment</h2>
        </div>
        {!hasBrand ? <p className="muted">ต้องสร้าง Brand ก่อน</p> : (
          <form action={createAudienceAction} className="stack" style={{ gap: 10 }}>
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <label className="field"><span>Brand</span><select name="brandId" required>{brandList.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
            <label className="field"><span>Code</span><input name="code" required pattern="[a-z0-9][a-z0-9-]*" placeholder="sme-owner" /></label>
            <label className="field"><span>ชื่อกลุ่มเป้าหมาย</span><input name="name" required minLength={2} maxLength={120} /></label>
            <label className="field"><span>Description</span><textarea name="description" maxLength={1200} /></label>
            <button className="primary" type="submit">บันทึก Audience</button>
          </form>
        )}
      </section>

      <section className="card stack" style={{ gap: 14, padding: 18 }}>
        <div>
          <p className="eyebrow">3 · Message</p>
          <h2 style={{ margin: 0 }}>เพิ่ม Message Pillar</h2>
        </div>
        {!hasBrand ? <p className="muted">ต้องสร้าง Brand ก่อน</p> : (
          <form action={createMessagePillarAction} className="stack" style={{ gap: 10 }}>
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <label className="field"><span>Brand</span><select name="brandId" required>{brandList.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
            <label className="field"><span>Code</span><input name="code" required pattern="[a-z0-9][a-z0-9-]*" placeholder="growth-with-evidence" /></label>
            <label className="field"><span>ชื่อ Pillar</span><input name="name" required /></label>
            <label className="field"><span>Priority</span><input name="priority" type="number" min="0" max="100" defaultValue="50" /></label>
            <label className="field"><span>Problem</span><textarea name="problem" maxLength={1200} /></label>
            <label className="field"><span>Promise</span><textarea name="promise" maxLength={1200} /></label>
            <label className="field"><span>Proof</span><textarea name="proof" maxLength={1200} /></label>
            <button className="primary" type="submit">บันทึก Message Pillar</button>
          </form>
        )}
      </section>

      <section className="card stack" style={{ gap: 14, padding: 18 }}>
        <div>
          <p className="eyebrow">4 · Offer</p>
          <h2 style={{ margin: 0 }}>เพิ่ม Offer</h2>
        </div>
        {!hasBrand ? <p className="muted">ต้องสร้าง Brand ก่อน</p> : (
          <form action={createOfferAction} className="stack" style={{ gap: 10 }}>
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <label className="field"><span>Brand</span><select name="brandId" required>{brandList.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
            <label className="field"><span>Code</span><input name="code" required pattern="[a-z0-9][a-z0-9-]*" placeholder="marketing-os-pilot" /></label>
            <label className="field"><span>ชื่อ Offer</span><input name="name" required /></label>
            <label className="field"><span>Offer type</span><input name="offerType" placeholder="pilot / consultation / product" /></label>
            <label className="field"><span>Description</span><textarea name="description" maxLength={1200} /></label>
            <label className="field"><span>Destination URL</span><input name="destinationUrl" type="url" placeholder="https://..." /></label>
            <button className="primary" type="submit">บันทึก Offer</button>
          </form>
        )}
      </section>

      <section className="card stack" style={{ gap: 14, padding: 18 }}>
        <div>
          <p className="eyebrow">5 · CTA</p>
          <h2 style={{ margin: 0 }}>เพิ่ม Call to Action</h2>
        </div>
        {!hasBrand ? <p className="muted">ต้องสร้าง Brand ก่อน</p> : (
          <form action={createCtaAction} className="stack" style={{ gap: 10 }}>
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <label className="field"><span>Brand</span><select name="brandId" required>{brandList.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
            <label className="field"><span>Code</span><input name="code" required pattern="[a-z0-9][a-z0-9-]*" placeholder="start-now" /></label>
            <label className="field"><span>ข้อความ CTA</span><input name="label" required /></label>
            <label className="field"><span>Action type</span><input name="actionType" required placeholder="link / form / chat" /></label>
            <label className="field"><span>Destination URL</span><input name="destinationUrl" type="url" placeholder="https://..." /></label>
            <button className="primary" type="submit">บันทึก CTA</button>
          </form>
        )}
      </section>

      <section className="card stack" style={{ gap: 14, padding: 18 }}>
        <div>
          <p className="eyebrow">6 · Guardrail</p>
          <h2 style={{ margin: 0 }}>เพิ่ม Brand / Compliance Rule</h2>
        </div>
        {!hasBrand ? <p className="muted">ต้องสร้าง Brand ก่อน</p> : (
          <form action={createBrandRuleAction} className="stack" style={{ gap: 10 }}>
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <label className="field"><span>Brand</span><select name="brandId" required>{brandList.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
            <label className="field"><span>Rule type</span><input name="ruleType" required placeholder="claim / tone / prohibited-term" /></label>
            <label className="field"><span>Severity</span><select name="severity" defaultValue="warning"><option value="info">Info</option><option value="warning">Warning</option><option value="blocking">Blocking</option></select></label>
            <label className="field"><span>Description</span><textarea name="description" required minLength={4} maxLength={1200} /></label>
            <label className="field"><span>Pattern (optional)</span><input name="pattern" maxLength={500} /></label>
            <button className="primary" type="submit">บันทึก Guardrail</button>
          </form>
        )}
      </section>

      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }} aria-label="Strategy setup actions">
        <Link className="primary" href={`/${workspaceSlug}/campaigns/new`}>สร้าง Campaign</Link>
        <Link href={`/${workspaceSlug}/home`}>กลับ Dashboard</Link>
        <Link href={`/${workspaceSlug}/feature/production-readiness`}>ตรวจ Production Readiness</Link>
      </nav>
    </main>
  );
}
