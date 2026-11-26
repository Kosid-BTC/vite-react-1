import Link from 'next/link';
import { getMarketingService } from '@/server/services';
import { severityMeta } from '@/lib/severity';
import { approvalMeta, assetTypeLabel, channelLabel, fileName } from '@/lib/labels';

export default async function ContentDetailPage({ params }: { params: Promise<{ workspaceSlug: string; contentId: string }> }) {
  const { workspaceSlug, contentId } = await params;
  const service = await getMarketingService();
  const data = await service.getContent(workspaceSlug, contentId);
  const current = data.versions[0];

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">ชิ้นงานคอนเทนต์</p>
        <h1>{data.content.title}</h1>
        <p className="muted">ข้อความ ภาพ การอนุมัติ และลิงก์ติดตามผล รวมอยู่ในที่เดียว</p>
      </header>

      <section className="card stack">
        <div>
          <span className="badge">งานที่ควรทำตอนนี้</span>
          <h2 style={{ marginTop: 12 }}>{data.nextAction.label}</h2>
        </div>
        {data.nextAction.code !== 'ready' ? (
          <button className="primary" type="button" data-action={data.nextAction.code}>
            {data.nextAction.label}
          </button>
        ) : (
          <div className="actions">
            <span className="badge">พร้อมเผยแพร่ (โพสต์เอง)</span>
            <Link className="secondary" href={`/${workspaceSlug}/home`}>กลับหน้าหลัก</Link>
          </div>
        )}
      </section>

      <section className="grid">
        <article className="card">
          <h2>ข้อความ</h2>
          {current ? (
            <>
              {current.hook && <p><strong>ประโยคเปิด:</strong> {current.hook}</p>}
              {current.body && <p className="muted">{current.body}</p>}
              <small className="muted">ฉบับที่ {current.version_number}</small>
            </>
          ) : <p className="muted">ยังไม่มีข้อความ</p>}
        </article>

        <article className="card">
          <h2>ภาพและไฟล์ประกอบ</h2>
          <p><strong>{data.assets.length}</strong> ไฟล์</p>
          <ul>
            {data.assets.slice(0, 5).map((asset) => <li key={asset.id}>{assetTypeLabel(asset.asset_type)} · {fileName(asset.storage_path)}</li>)}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>ตรวจตามกฎแบรนด์</h2>
        {data.findings.length === 0 ? <p className="muted">ยังไม่พบจุดที่ผิดกฎ</p> : (
          <div className="stack">
            {data.findings.map((finding) => (
              <div key={finding.id}>
                <span className={severityMeta(finding.severity).className}>
                  <span aria-hidden="true">{severityMeta(finding.severity).icon}</span>&nbsp;{severityMeta(finding.severity).label}
                </span>
                <p>{finding.finding}</p>
                {finding.suggested_fix && <p className="muted">แนะนำ: {finding.suggested_fix}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid">
        <article className="card">
          <h2>การอนุมัติ</h2>
          {data.approvals[0] ? <p>สถานะล่าสุด: <span className={approvalMeta(data.approvals[0].status).className}>{approvalMeta(data.approvals[0].status).label}</span></p> : <p className="muted">ยังไม่ได้ส่งอนุมัติ</p>}
        </article>
        <article className="card">
          <h2>ลิงก์ติดตามผล <span className="muted">(UTM)</span></h2>
          {data.tracking[0] ? (
            <>
              <p>ช่องทาง: <strong>{channelLabel(data.tracking[0].utm_source, data.tracking[0].utm_medium)}</strong></p>
              <p className="muted">วัดผลแยกตามกลุ่มเป้าหมายแล้ว</p>
            </>
          ) : <p className="muted">ยังไม่มีลิงก์ติดตามผล</p>}
        </article>
      </section>
    </main>
  );
}
