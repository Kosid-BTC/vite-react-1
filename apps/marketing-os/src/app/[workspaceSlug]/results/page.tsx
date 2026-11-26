import Link from 'next/link';
import { getMarketingRepository } from '@/server/services';
import type { FunnelSummaryRow } from '@/types/database.types';
import { readOrDenied } from '@/lib/supabase/errors';

export const dynamic = 'force-dynamic';

// กฎแบรนด์ (measurement): ห้ามสรุป conversion เป็นข้อยืนยันเมื่อ sample ต่ำกว่าเกณฑ์
const MIN_SAMPLE = 30;
const PERIODS = [7, 30, 90] as const;

const EVENT_LABEL: Record<string, string> = {
  view: 'เปิดดู',
  engaged: 'อ่าน/ดูจริงจัง',
  action: 'กดลงมือทำ',
};

function pct(part: number, whole: number) {
  if (whole < MIN_SAMPLE) return null;
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function Rate({ part, whole }: { part: number; whole: number }) {
  const r = pct(part, whole);
  return r ? <span>{part} <span className="muted">({r})</span></span> : <span>{part}</span>;
}

function bkk(iso: string) {
  return new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' });
}

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { workspaceSlug } = await params;
  const { days: daysParam } = await searchParams;
  const days = PERIODS.includes(Number(daysParam) as (typeof PERIODS)[number]) ? Number(daysParam) : 30;

  const repo = await getMarketingRepository();
  const workspace = await repo.getWorkspaceBySlug(workspaceSlug);
  const [funnelRes, segments, eventsRes] = await Promise.all([
    readOrDenied(() => repo.getSaasFunnelSummary(workspace.id, days)),
    repo.getAudienceSegments(workspace.id),
    readOrDenied(() => repo.getBehaviorEvents(workspace.id, 50)),
  ]);
  // 0075: สมาชิกอ่านได้ · คนที่ไม่ใช่สมาชิกได้ 42501 ⇒ เห็นข้อความแทน ไม่ใช่หน้าพัง
  const funnel = funnelRes.ok ? funnelRes.data : [];
  const events = eventsRes.ok ? eventsRes.data : [];

  const segName = new Map(segments.map((s) => [s.code, s.name]));
  const bySeg = new Map<string, FunnelSummaryRow>();
  for (const r of funnel) {
    const cur = bySeg.get(r.os_code) ?? { ...r, utm_source: '', utm_campaign: '', sessions: 0, reached_cta: 0, reached_signup: 0, leads: 0 };
    cur.sessions += Number(r.sessions);
    cur.reached_cta += Number(r.reached_cta);
    cur.reached_signup += Number(r.reached_signup);
    cur.leads += Number(r.leads);
    bySeg.set(r.os_code, cur);
  }
  const segRows = [...bySeg.values()].sort((a, b) => b.sessions - a.sessions);
  const total = segRows.reduce((n, r) => n + r.sessions, 0);
  const untargeted = bySeg.get('default')?.sessions ?? 0;

  const eventCounts = events.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.name]: (acc[e.name] ?? 0) + 1 }), {});

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">ผลลัพธ์ · {workspace.name}</p>
        <h1>แคมเปญพาคนไปถึงไหนแล้ว?</h1>
        <p className="muted">ข้อมูลจริงจากหน้าเว็บ ceoaithailand.org — ตัวเลขรวมเท่านั้น ไม่มีข้อมูลส่วนบุคคล</p>
        <nav className="actions" aria-label="ช่วงเวลา">
          {PERIODS.map((d) => (
            <Link key={d} href={`/${workspaceSlug}/results?days=${d}`} className={d === days ? 'topnav-link active' : 'topnav-link'} aria-current={d === days ? 'true' : undefined}>
              {d} วัน
            </Link>
          ))}
        </nav>
      </header>

      <section className="card stack" aria-labelledby="funnel-heading">
        <div>
          <h2 id="funnel-heading">คนจากแต่ละกลุ่มเป้าหมาย ({days} วันล่าสุด)</h2>
          <p className="muted">
            คนเข้าเว็บ {total} คน · {untargeted} คน ({total ? Math.round((untargeted / total) * 100) : 0}%) ไม่ได้มาจากลิงก์เฉพาะกลุ่ม
          </p>
        </div>
        {!funnelRes.ok ? (
          <p className="notice" role="status">
            บัญชีนี้ยังอ่านผลจากหน้าเว็บ SaaS ไม่ได้ — ต้องเป็นสมาชิกของ workspace นี้
          </p>
        ) : segRows.length === 0 ? (
          <p className="muted">ยังไม่มีคนเข้าเว็บในช่วงนี้</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">กลุ่มเป้าหมาย</th>
                  <th scope="col">เข้าเว็บ</th>
                  <th scope="col">ถึงปุ่ม CTA</th>
                  <th scope="col">ถึงหน้าสมัคร</th>
                  <th scope="col">ทิ้งข้อมูลติดต่อ</th>
                </tr>
              </thead>
              <tbody>
                {segRows.map((r) => (
                  <tr key={r.os_code}>
                    <th scope="row">
                      {r.os_code === 'default' ? <span className="muted">ไม่ระบุกลุ่ม (ลิงก์ทั่วไป)</span> : segName.get(r.os_code) ?? r.os_code}
                      {r.sessions < MIN_SAMPLE && <span className="badge sev-info" style={{ marginLeft: 8 }}>ตัวอย่างยังน้อย</span>}
                    </th>
                    <td>{r.sessions}</td>
                    <td><Rate part={r.reached_cta} whole={r.sessions} /></td>
                    <td><Rate part={r.reached_signup} whole={r.sessions} /></td>
                    <td>{r.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="help">
          แสดง % เฉพาะกลุ่มที่มีคนเข้าอย่างน้อย {MIN_SAMPLE} คน — น้อยกว่านั้นยังสรุปไม่ได้ (ตามกฎแบรนด์เรื่องการวัดผล)
        </p>

        <details className="more">
          <summary>แยกตามช่องทาง (UTM)</summary>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th scope="col">กลุ่ม</th><th scope="col">ช่องทาง</th><th scope="col">แคมเปญ</th><th scope="col">เข้าเว็บ</th><th scope="col">ถึง CTA</th></tr>
              </thead>
              <tbody>
                {funnel.map((r) => (
                  <tr key={`${r.os_code}|${r.utm_source}|${r.utm_campaign}`}>
                    <td>{r.os_code === 'default' ? 'ไม่ระบุ' : segName.get(r.os_code) ?? r.os_code}</td>
                    <td>{r.utm_source === '(none)' ? <span className="muted">ไม่มี UTM</span> : r.utm_source}</td>
                    <td>{r.utm_campaign === '(none)' ? <span className="muted">—</span> : r.utm_campaign}</td>
                    <td>{r.sessions}</td>
                    <td>{r.reached_cta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="card stack" aria-labelledby="events-heading">
        <div>
          <h2 id="events-heading">พฤติกรรมบนคอนเทนต์ ({events.length} ครั้งล่าสุด)</h2>
          <p className="muted">ส่งมาจากเว็บไซต์ผ่านท่อ behavior ingest</p>
        </div>
        {!eventsRes.ok && (
          <p className="notice" role="status">
            บัญชีนี้ยังอ่าน behavior events ไม่ได้ — ต้องเป็นสมาชิกของ workspace นี้
          </p>
        )}
        <div className="grid" hidden={!eventsRes.ok}>
          {Object.entries(EVENT_LABEL).map(([key, label]) => (
            <article key={key} className="card">
              <p className="eyebrow">{label}</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{eventCounts[key] ?? 0}</p>
            </article>
          ))}
        </div>
        {events.length > 0 && (
          <details className="more">
            <summary>รายการล่าสุด</summary>
            <ul className="steps">
              {events.slice(0, 15).map((e) => (
                <li key={e.id}>
                  <span className="badge sev-info">{EVENT_LABEL[e.name] ?? e.name}</span>
                  <span>
                    {e.topic ?? 'ไม่ระบุหัวข้อ'}
                    {e.format && <span className="muted"> · {e.format}</span>}
                    <span className="muted"> · {bkk(e.occurred_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </main>
  );
}
