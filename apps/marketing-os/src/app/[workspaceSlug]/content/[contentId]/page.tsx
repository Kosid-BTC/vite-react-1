import Link from 'next/link';
import { getMarketingService } from '@/server/services';
import {
  createManualContentVersionAction,
  createTrackingLinkAction,
  requestApprovalAction,
} from './actions';

export default async function ContentDetailPage({ params }: { params: Promise<{ workspaceSlug: string; contentId: string }> }) {
  const { workspaceSlug, contentId } = await params;
  const service = await getMarketingService();
  const data = await service.getContent(workspaceSlug, contentId);
  const current = data.versions[0];
  const latestApproval = data.approvals[0];
  const approved = data.approvals.some((item) => item.status === 'approved');
  const hasPendingApproval = data.approvals.some((item) => item.status === 'pending');

  return (
    <main className="shell stack" style={{ maxWidth: 1080, paddingTop: 40, paddingBottom: 64, gap: 20 }}>
      <header>
        <p className="eyebrow">Content Object</p>
        <h1>{data.content.title}</h1>
        <p className="muted">Text, Image, Approval และ Tracking อยู่ภายใต้ Content เดียวกัน</p>
      </header>

      <section className="card stack" style={{ gap: 12 }}>
        <div>
          <span className="badge">Next Best Action</span>
          <h2 style={{ marginTop: 12 }}>{data.nextAction.label}</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            ระบบจะเสนอเฉพาะ Action ที่ backend รองรับจริง; งาน AI generation ที่ยังไม่มี provider จะไม่ถูกแสดงเป็นปุ่มหลอก
          </p>
        </div>

        {data.nextAction.code === 'generate_text' && (
          <a href="#manual-version" className="primary">สร้างข้อความแบบ Manual</a>
        )}
        {data.nextAction.code === 'generate_image' && (
          <Link className="primary" href={`/${workspaceSlug}/feature/text-to-image`}>เปิด Image generation queue</Link>
        )}
        {data.nextAction.code === 'resolve_compliance' && (
          <Link className="primary" href={`/${workspaceSlug}/feature/brand-guardrails`}>ตรวจ Brand / Compliance</Link>
        )}
        {data.nextAction.code === 'request_approval' && !hasPendingApproval && (
          <form action={requestApprovalAction}>
            <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
            <input type="hidden" name="contentId" value={contentId} />
            <button className="primary" type="submit">ส่งตรวจอนุมัติ</button>
          </form>
        )}
        {hasPendingApproval && <span className="badge">รอ Human Review</span>}
        {data.nextAction.code === 'create_tracking' && <a href="#tracking" className="primary">สร้าง Tracking Link</a>}
        {data.nextAction.code === 'ready' && (
          <div className="actions">
            <span className="badge">พร้อมเผยแพร่แบบ Manual</span>
            <Link className="secondary" href={`/${workspaceSlug}/feature/publishing`}>ตรวจ Publishing Readiness</Link>
          </div>
        )}
      </section>

      <section id="manual-version" className="card stack" style={{ gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Content Version</h2>
          <p className="muted" style={{ margin: 0 }}>สร้าง Version แบบ Manual ได้ทันที ขณะที่ AI provider workflow ยังแยกเป็น queue ที่ตรวจสอบได้</p>
        </div>
        <form action={createManualContentVersionAction} className="stack" style={{ gap: 10 }}>
          <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
          <input type="hidden" name="contentId" value={contentId} />
          <label className="field"><span>Hook</span><textarea name="hook" maxLength={500} defaultValue={current?.hook ?? ''} /></label>
          <label className="field"><span>Body</span><textarea name="body" maxLength={10000} defaultValue={current?.body ?? ''} /></label>
          <label className="field"><span>Caption</span><textarea name="caption" maxLength={5000} defaultValue={current?.caption ?? ''} /></label>
          <button className="primary" type="submit">บันทึก Version ใหม่</button>
        </form>
        {current && <small className="muted">Current version: {current.version_number}</small>}
      </section>

      <section className="grid">
        <article className="card">
          <h2>ข้อความล่าสุด</h2>
          {current ? (
            <>
              {current.hook && <p><strong>Hook:</strong> {current.hook}</p>}
              {current.body && <p className="muted">{current.body}</p>}
              {current.caption && <p className="muted">Caption: {current.caption}</p>}
              <small className="muted">Version {current.version_number}</small>
            </>
          ) : <p className="muted">ยังไม่มี Content Version</p>}
        </article>

        <article className="card">
          <h2>Creative Assets</h2>
          <p><strong>{data.assets.length}</strong> assets</p>
          {data.assets.length === 0 ? <p className="muted">ยังไม่มี Asset จริง</p> : (
            <ul>{data.assets.slice(0, 5).map((asset) => <li key={asset.id}>{asset.asset_type} · {asset.storage_path}</li>)}</ul>
          )}
          <Link href={`/${workspaceSlug}/feature/text-to-image`}>เปิด Image generation queue</Link>
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
        <article className="card stack" style={{ gap: 10 }}>
          <h2>Approval</h2>
          {latestApproval ? (
            <>
              <p>สถานะล่าสุด: <strong>{latestApproval.status}</strong></p>
              {latestApproval.review_notes && <p className="muted">{latestApproval.review_notes}</p>}
              {hasPendingApproval && <Link href={`/${workspaceSlug}/approvals`}>เปิด Approval Queue</Link>}
            </>
          ) : (
            <>
              <p className="muted">ยังไม่ได้ส่งอนุมัติ</p>
              {current && (
                <form action={requestApprovalAction}>
                  <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                  <input type="hidden" name="contentId" value={contentId} />
                  <button className="primary" type="submit">ส่งตรวจอนุมัติ</button>
                </form>
              )}
            </>
          )}
        </article>

        <article id="tracking" className="card stack" style={{ gap: 10 }}>
          <h2>UTM / Tracking</h2>
          {data.tracking[0] ? (
            <>
              <p><strong>{data.tracking[0].utm_source}</strong> / {data.tracking[0].utm_medium}</p>
              <p className="muted">seg={data.tracking[0].segment_code}</p>
              <p className="muted" style={{ wordBreak: 'break-all' }}>{data.tracking[0].final_url}</p>
            </>
          ) : (
            <form action={createTrackingLinkAction} className="stack" style={{ gap: 8 }}>
              <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
              <input type="hidden" name="contentId" value={contentId} />
              <label className="field"><span>Destination URL</span><input name="destinationUrl" type="url" required placeholder="https://..." /></label>
              <label className="field"><span>UTM Source</span><input name="utmSource" required placeholder="facebook" /></label>
              <label className="field"><span>UTM Medium</span><input name="utmMedium" required placeholder="social" /></label>
              <label className="field"><span>UTM Campaign</span><input name="utmCampaign" required placeholder="campaign-code" /></label>
              <label className="field"><span>UTM Content</span><input name="utmContent" /></label>
              <label className="field"><span>UTM Term</span><input name="utmTerm" /></label>
              <label className="field"><span>Segment Code</span><input name="segmentCode" required placeholder="sme-owner" /></label>
              <button className="primary" type="submit" disabled={!approved}>สร้าง Tracking Link</button>
              {!approved && <small className="muted">Tracking จะเปิดให้สร้างหลัง Content ผ่าน Approval เพื่อรักษา evidence chain</small>}
            </form>
          )}
        </article>
      </section>

      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Link href={`/${workspaceSlug}/content/new`}>สร้าง Content ใหม่</Link>
        <Link href={`/${workspaceSlug}/approvals`}>Review & Approve</Link>
        <Link href={`/${workspaceSlug}/home`}>กลับ Dashboard</Link>
      </nav>
    </main>
  );
}
