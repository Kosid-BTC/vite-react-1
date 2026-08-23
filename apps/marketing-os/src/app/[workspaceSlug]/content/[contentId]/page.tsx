import Link from 'next/link';
import { getMarketingService } from '@/server/services';

export default async function ContentDetailPage({ params }: { params: Promise<{ workspaceSlug: string; contentId: string }> }) {
  const { workspaceSlug, contentId } = await params;
  const service = await getMarketingService();
  const data = await service.getContent(workspaceSlug, contentId);
  const current = data.versions[0];

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">Content Object</p>
        <h1>{data.content.title}</h1>
        <p className="muted">Text, Image, Approval และ Tracking อยู่ภายใต้ Content เดียวกัน</p>
      </header>

      <section className="card stack">
        <div>
          <span className="badge">Next Best Action</span>
          <h2 style={{ marginTop: 12 }}>{data.nextAction.label}</h2>
        </div>
        {data.nextAction.code !== 'ready' ? (
          <button className="primary" type="button" data-action={data.nextAction.code}>
            {data.nextAction.label}
          </button>
        ) : (
          <div className="actions">
            <span className="badge">พร้อมเผยแพร่แบบ Manual</span>
            <Link className="secondary" href={`/${workspaceSlug}/home`}>กลับ Home</Link>
          </div>
        )}
      </section>

      <section className="grid">
        <article className="card">
          <h2>ข้อความ</h2>
          {current ? (
            <>
              {current.hook && <p><strong>Hook:</strong> {current.hook}</p>}
              {current.body && <p className="muted">{current.body}</p>}
              <small className="muted">Version {current.version_number}</small>
            </>
          ) : <p className="muted">ยังไม่มี Content Version</p>}
        </article>

        <article className="card">
          <h2>Creative Assets</h2>
          <p><strong>{data.assets.length}</strong> assets</p>
          <ul>
            {data.assets.slice(0, 5).map((asset) => <li key={asset.id}>{asset.asset_type} · {asset.storage_path}</li>)}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>Brand & Compliance</h2>
        {data.findings.length === 0 ? <p className="muted">ยังไม่มี finding</p> : (
          <div className="stack">
            {data.findings.map((finding) => (
              <div key={finding.id}>
                <span className={`badge ${finding.severity === 'blocking' ? 'blocking' : 'warning'}`}>{finding.severity}</span>
                <p>{finding.finding}</p>
                {finding.suggested_fix && <p className="muted">แนะนำ: {finding.suggested_fix}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid">
        <article className="card">
          <h2>Approval</h2>
          {data.approvals[0] ? <p>สถานะล่าสุด: <strong>{data.approvals[0].status}</strong></p> : <p className="muted">ยังไม่ได้ส่งอนุมัติ</p>}
        </article>
        <article className="card">
          <h2>UTM / Tracking</h2>
          {data.tracking[0] ? (
            <>
              <p><strong>{data.tracking[0].utm_source}</strong> / {data.tracking[0].utm_medium}</p>
              <p className="muted">seg={data.tracking[0].segment_code}</p>
            </>
          ) : <p className="muted">ยังไม่มี Tracking Link</p>}
        </article>
      </section>
    </main>
  );
}
