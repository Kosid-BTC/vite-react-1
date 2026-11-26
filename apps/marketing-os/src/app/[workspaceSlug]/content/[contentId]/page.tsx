import Link from 'next/link';
import { getMarketingService } from '@/server/services';
import { severityMeta } from '@/lib/severity';
import { approvalMeta, assetTypeLabel, channelLabel, fileName } from '@/lib/labels';
import { DecisionForm, ResolveForm } from '@/components/StudioForms';
import type { ImageBrief } from '@/server/brain';

export const dynamic = 'force-dynamic';

type Script = { hooks?: string[]; cta?: string; story_model?: string; writing_style?: string; angle?: string };

export default async function ContentDetailPage({ params }: { params: Promise<{ workspaceSlug: string; contentId: string }> }) {
  const { workspaceSlug, contentId } = await params;
  const service = await getMarketingService();
  const data = await service.getContent(workspaceSlug, contentId);
  const current = data.versions[0];
  const script = (current?.script ?? {}) as Script;
  const brief = (current?.creative_brief ?? null) as ImageBrief | null;
  const approval = data.approvals[0];
  const link = data.tracking[0];
  const openBlocking = data.findings.filter((f) => f.severity === 'blocking' && !f.resolved);

  // Phase 1 = ข้อความ + brief ภาพ ⇒ ขั้นถัดไปคิดจากการตรวจ/อนุมัติ (ไม่บังคับมีภาพก่อน)
  const next = openBlocking.length
    ? { label: `แก้ข้อห้ามเด็ดขาด ${openBlocking.length} ข้อ`, href: '#compliance' }
    : approval?.status === 'pending'
      ? { label: 'ตรวจและอนุมัติร่างนี้', href: '#approval' }
      : approval?.status === 'approved'
        ? { label: 'โพสต์เอง: คัดลอกข้อความ + ลิงก์ติดตามผล', href: '#publish' }
        : { label: 'ปรับแก้ แล้วสร้างร่างใหม่จากหน้าสร้างสื่อ', href: `/${workspaceSlug}/studio` };

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">ชิ้นงานคอนเทนต์{script.angle ? ` · ${script.angle}` : ''}</p>
        <h1>{data.content.title}</h1>
        <p className="muted">ข้อความ ภาพ การอนุมัติ และลิงก์ติดตามผล รวมอยู่ในที่เดียว</p>
      </header>

      <section className="card stack">
        <div>
          <span className="badge">งานที่ควรทำตอนนี้</span>
          <h2 style={{ marginTop: 12 }}>{next.label}</h2>
        </div>
        <div className="actions">
          <Link className="primary" href={next.href}>ไปที่ขั้นนี้ →</Link>
          <Link className="secondary" href={`/${workspaceSlug}/studio`}>กลับหน้าสร้างสื่อ</Link>
        </div>
      </section>

      <section className="card stack" id="publish" aria-labelledby="copy-h">
        <h2 id="copy-h">ข้อความโฆษณา</h2>
        {current ? (
          <>
            {script.story_model && <p className="muted">{script.story_model} · {script.writing_style}</p>}
            {current.hook && <p><strong>ประโยคเปิด:</strong> {current.hook}</p>}
            {current.body && <p style={{ whiteSpace: 'pre-wrap' }}>{current.body}</p>}
            {current.caption && <p className="muted" style={{ whiteSpace: 'pre-wrap' }}><strong>Caption:</strong> {current.caption}</p>}
            {script.cta && <p><strong>CTA:</strong> {script.cta}</p>}
            {script.hooks && script.hooks.length > 1 && (
              <details className="more">
                <summary>ประโยคเปิดทางเลือก ({script.hooks.length})</summary>
                <ul>{script.hooks.map((h, i) => <li key={i}>{h}</li>)}</ul>
              </details>
            )}
            {link && (
              <div className="card">
                <p className="eyebrow">ลิงก์ติดตามผล — ใช้ลิงก์นี้ตอนโพสต์เท่านั้น ผลจะไหลกลับมาที่หน้า &ldquo;ผลลัพธ์&rdquo;</p>
                <code style={{ wordBreak: 'break-all' }}>{link.final_url}</code>
                <p className="muted">ช่องทาง: {channelLabel(link.utm_source, link.utm_medium)}</p>
              </div>
            )}
            <small className="muted">ฉบับที่ {current.version_number}{current.model_name ? ` · เขียนโดย ${current.model_name}` : ''}</small>
          </>
        ) : <p className="muted">ยังไม่มีข้อความ</p>}
      </section>

      <section className="grid">
        <article className="card stack">
          <h2>Brief ภาพ</h2>
          {brief ? (
            <>
              <p><strong>แนวคิด:</strong> {brief.concept}</p>
              <p><strong>องค์ประกอบ:</strong> {brief.composition}</p>
              <p><strong>ข้อความบนภาพ:</strong> {brief.on_image_text}</p>
              <p><strong>สไตล์:</strong> {brief.style}</p>
              <p className="muted"><strong>หลีกเลี่ยง:</strong> {brief.avoid}</p>
            </>
          ) : <p className="muted">ยังไม่มี brief</p>}
        </article>
        <article className="card">
          <h2>ภาพและไฟล์ประกอบ</h2>
          <p><strong>{data.assets.length}</strong> ไฟล์</p>
          <ul>
            {data.assets.slice(0, 5).map((asset) => <li key={asset.id}>{assetTypeLabel(asset.asset_type)} · {fileName(asset.storage_path)}</li>)}
          </ul>
        </article>
      </section>

      <section className="card stack" id="compliance">
        <h2>ตรวจตามกฎแบรนด์</h2>
        {data.findings.length === 0 ? <p className="muted">ไม่พบจุดที่ผิดกฎ</p> : (
          <ul className="rule-list">
            {data.findings.map((f) => {
              const sev = severityMeta(f.severity);
              return (
                <li key={f.id} className={`rule-item is-${f.severity}`}>
                  <span className={sev.className}><span aria-hidden="true">{sev.icon}</span>&nbsp;{sev.label}</span>
                  <div className="stack" style={{ gap: 6 }}>
                    <span style={{ textDecoration: f.resolved ? 'line-through' : undefined }}>{f.finding}</span>
                    {f.suggested_fix && <span className="muted">แนะนำ: {f.suggested_fix}</span>}
                    {f.resolved
                      ? <span className="muted">✓ แก้แล้ว</span>
                      : <ResolveForm workspaceSlug={workspaceSlug} contentId={contentId} findingId={f.id} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card stack" id="approval">
        <h2>การอนุมัติ</h2>
        {approval ? (
          <>
            <p>สถานะ: <span className={approvalMeta(approval.status).className}>{approvalMeta(approval.status).label}</span></p>
            {approval.review_notes && <p className="muted">หมายเหตุ: {approval.review_notes}</p>}
            {approval.status === 'pending' && (
              <DecisionForm workspaceSlug={workspaceSlug} contentId={contentId} approvalId={approval.id} blocking={openBlocking.length} />
            )}
          </>
        ) : <p className="muted">ยังไม่ได้ส่งอนุมัติ</p>}
      </section>
    </main>
  );
}
