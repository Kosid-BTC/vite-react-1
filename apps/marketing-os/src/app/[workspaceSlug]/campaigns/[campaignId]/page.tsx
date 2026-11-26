import Link from 'next/link';

// Zeigarnik + Goal-Gradient: บอกว่าเดินมาถึงไหนแล้ว และขั้นถัดไปคืออะไร (ไม่โชว์ UUID ดิบ)
const STEPS = [
  { label: 'สร้างแคมเปญ + สมมติฐาน', state: 'done' },
  { label: 'สร้างคอนเทนต์จากกลุ่มเป้าหมาย + สมมติฐาน', state: 'next' },
  { label: 'ตรวจกฎแบรนด์ + ส่งอนุมัติ', state: 'todo' },
  { label: 'สร้างลิงก์ติดตามผล (UTM) แล้วเผยแพร่', state: 'todo' },
] as const;

export default async function CampaignPage({ params }: { params: Promise<{ workspaceSlug: string; campaignId: string }> }) {
  const { workspaceSlug } = await params;
  const doneCount = STEPS.filter((s) => s.state === 'done').length;

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">✅ บันทึกแคมเปญแล้ว</p>
        <h1>เสร็จ {doneCount} จาก {STEPS.length} ขั้น — ต่อไปคือสร้างคอนเทนต์</h1>
        <p className="muted">แคมเปญของคุณพร้อมเป็นฐานให้คอนเทนต์ทุกชิ้นแล้ว</p>
      </header>

      <section className="card stack" aria-labelledby="progress-heading">
        <h2 id="progress-heading">ความคืบหน้า</h2>
        <ol className="steps">
          {STEPS.map((step, i) => (
            <li
              key={step.label}
              className={step.state === 'done' ? 'step-done' : step.state === 'next' ? 'step-next' : undefined}
              aria-current={step.state === 'next' ? 'step' : undefined}
            >
              <span className="step-dot" aria-hidden="true">{step.state === 'done' ? '✓' : i + 1}</span>
              <span>
                {step.label}
                {step.state === 'next' && <span className="muted"> — ขั้นถัดไป</span>}
              </span>
            </li>
          ))}
        </ol>
        <div className="actions">
          <Link className="primary" href={`/${workspaceSlug}/home`}>ดูงานถัดไปที่หน้าหลัก →</Link>
          <Link className="secondary" href={`/${workspaceSlug}/campaigns/new`}>สร้างแคมเปญอีกอัน</Link>
        </div>
      </section>
    </main>
  );
}
