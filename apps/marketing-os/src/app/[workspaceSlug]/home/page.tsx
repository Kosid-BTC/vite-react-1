import Link from 'next/link';
import { getMarketingService } from '@/server/services';

export default async function HomePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const service = await getMarketingService();
  const data = await service.getHome(workspaceSlug);

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">Marketing Brain · Phase 1</p>
        <h1>วันนี้ควรทำอะไรต่อ?</h1>
        <p className="muted">{data.workspace.name} — แสดงเฉพาะงานที่ช่วยให้ Campaign เดินหน้าต่อ</p>
      </header>

      <section className="card stack" aria-labelledby="next-action">
        <div>
          <span className="badge">Next Best Action</span>
          <h2 id="next-action" style={{ marginTop: 12 }}>{data.primaryAction.title}</h2>
          <p className="muted">{data.primaryAction.description}</p>
        </div>
        <div className="actions">
          <Link className="primary" href={data.primaryAction.action_href ?? `/${workspaceSlug}/campaigns/new`}>
            ดำเนินการต่อ
          </Link>
        </div>
      </section>

      {data.actions.length > 1 && (
        <section>
          <h2>ถัดไป</h2>
          <div className="grid">
            {data.actions.slice(1).map((action) => (
              <article className="card" key={action.id}>
                <p className="eyebrow">Priority {action.priority}</p>
                <h3>{action.title}</h3>
                {action.description && <p className="muted">{action.description}</p>}
                {action.action_href && <Link className="secondary" href={action.action_href}>เปิดงาน</Link>}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
