import Link from 'next/link';
import { getMarketingService } from '@/server/services';

const growthLoop = [
  { key: 'SEE', title: 'เห็นข้อมูลจริง', detail: 'First-party evidence และเหตุการณ์ที่ตรวจสอบย้อนกลับได้' },
  { key: 'UNDERSTAND', title: 'เข้าใจสถานการณ์', detail: 'Measurement Health, Funnel และ Segmentation ก่อนตีความ' },
  { key: 'DECIDE', title: 'ตัดสินใจ', detail: 'AI เสนอทางเลือกจากหลักฐาน แต่คนเป็นผู้อนุมัติ' },
  { key: 'VALIDATE', title: 'ทดลอง', detail: 'Hypothesis และ Experiment Plan ที่วัดผลได้' },
  { key: 'ACT', title: 'ลงมือทำ', detail: 'Campaign / Sales Action หลังผ่าน Human Approval' },
  { key: 'MEASURE', title: 'วัดผล', detail: 'Observed Outcome, Attribution และ Revenue Evidence' },
  { key: 'LEARN', title: 'เรียนรู้', detail: 'สรุปสิ่งที่เกิดขึ้นและสร้าง Next Best Action รอบถัดไป' },
] as const;

export default async function HomePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const service = await getMarketingService();
  const data = await service.getHome(workspaceSlug);

  return (
    <main className="shell stack dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">CEO AI Thailand · Business Growth Closed Loop</p>
          <h1>วันนี้ควรทำอะไรต่อ?</h1>
          <p className="muted">{data.workspace.name} — เริ่มจากหลักฐานจริง แล้วพาธุรกิจไปสู่การตัดสินใจที่วัดผลได้</p>
        </div>
        <div className="evidence-chip" aria-label="Evidence-first governance">
          Evidence First · Human Approval
        </div>
      </header>

      <section className="card stack action-hero" aria-labelledby="next-action">
        <div className="action-hero-copy">
          <span className="badge">Next Best Action</span>
          <h2 id="next-action">{data.primaryAction.title}</h2>
          <p className="muted">{data.primaryAction.description}</p>
        </div>
        <div className="actions">
          <Link className="primary" href={data.primaryAction.action_href ?? `/${workspaceSlug}/campaigns/new`}>
            ดำเนินการต่อ
          </Link>
        </div>
      </section>

      <section className="card stack" aria-labelledby="growth-loop-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Growth Operating System</p>
            <h2 id="growth-loop-title">SEE → UNDERSTAND → DECIDE → VALIDATE → ACT → MEASURE → LEARN</h2>
          </div>
          <p className="muted section-note">ระบบไม่สร้างตัวเลขหรือความมั่นใจขึ้นเอง หากหลักฐานไม่พอ ระบบต้องบอกให้เก็บข้อมูลเพิ่มก่อน</p>
        </div>

        <ol className="growth-loop" aria-label="Business Growth Closed Loop">
          {growthLoop.map((stage, index) => (
            <li className="growth-stage" key={stage.key}>
              <div className="growth-stage-index">{String(index + 1).padStart(2, '0')}</div>
              <div>
                <p className="growth-stage-key">{stage.key}</p>
                <h3>{stage.title}</h3>
                <p className="muted">{stage.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="decision-guardrail" aria-label="Decision guardrails">
        <div>
          <strong>Measurement Health ก่อนคำแนะนำเชิงธุรกิจ</strong>
          <p>ข้อมูลยังไม่พร้อม = แสดงจำนวนจริงและสิ่งที่ต้องเก็บเพิ่ม แทนการสรุป Conversion, CPA, ROAS หรือ LTV/CAC เกินหลักฐาน</p>
        </div>
        <div>
          <strong>AI เสนอ · คนอนุมัติ</strong>
          <p>Experiment winner, Next Best Action, Campaign และ Sales Action ยังต้องผ่าน Human Review ก่อนนำไปใช้</p>
        </div>
      </section>

      {data.actions.length > 1 && (
        <section aria-labelledby="queue-title">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Work Queue</p>
              <h2 id="queue-title">งานถัดไป</h2>
            </div>
          </div>
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
