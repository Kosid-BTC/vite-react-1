import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AnalyzeForm, GenerateForm } from '@/components/StudioForms';
import type { AnalyzeResult } from '@/server/brain';

export const dynamic = 'force-dynamic';

const LEVEL: Record<string, string> = { fact: 'ข้อเท็จจริง', estimate: 'ประมาณการ', opinion: 'ความเห็น' };
const CONF: Record<string, string> = { low: 'ต่ำ', medium: 'กลาง', high: 'สูง' };
const STATUS: Record<string, { label: string; cls: string }> = {
  in_review: { label: 'รออนุมัติ', cls: 'badge sev-warning' },
  approved: { label: 'อนุมัติแล้ว', cls: 'badge' },
  draft: { label: 'ขอให้แก้', cls: 'badge sev-info' },
  archived: { label: 'ไม่ใช้', cls: 'badge sev-info' },
};

export default async function StudioPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const db = await createSupabaseServerClient();
  const { data: ws } = await db.from('workspaces').select('id,name').eq('slug', workspaceSlug).single();
  if (!ws) return <main className="shell"><p className="notice">ไม่พบ workspace หรือบัญชีนี้ไม่ใช่สมาชิก</p></main>;

  const [segs, pils, job, drafts] = await Promise.all([
    db.from('marketing_audience_segments').select('id,code,name').eq('workspace_id', ws.id).eq('active', true).order('created_at'),
    db.from('marketing_message_pillars').select('id,code,name').eq('workspace_id', ws.id).eq('active', true).order('priority', { ascending: false }),
    db.from('marketing_ai_jobs').select('output,created_at').eq('workspace_id', ws.id).eq('status', 'succeeded')
      .eq('input->>task', 'analyze').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('marketing_content_items').select('id,title,status,primary_channel,created_at').eq('workspace_id', ws.id)
      .eq('content_type', 'ad').order('created_at', { ascending: false }).limit(12),
  ]);
  const analysis = (job.data?.output ?? null) as AnalyzeResult | null;

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">สร้างสื่อ · {ws.name}</p>
        <h1>จากข้อมูลจริง สู่ร่างโฆษณา</h1>
        <p className="muted">วิเคราะห์ข้อมูลจาก ceoaithailand.org → ร่างโฆษณา + brief ภาพ → ตรวจกฎแบรนด์ → คุณอนุมัติ → โพสต์เองพร้อมลิงก์ติดตามผล</p>
      </header>

      <section className="card stack" aria-labelledby="s1">
        <h2 id="s1">1. วิเคราะห์ข้อมูล</h2>
        {analysis ? (
          <div className="stack">
            <p className="muted">ผลล่าสุด · {new Date(job.data!.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</p>
            <p><strong>{analysis.summary}</strong></p>
            <p className={analysis.data_quality.enough_sample ? 'badge' : 'notice'}>
              {analysis.data_quality.enough_sample ? '✓ ข้อมูลพอให้สรุปบางส่วน' : '⚠️ ข้อมูลยังน้อย — ใช้เป็นสมมติฐานเท่านั้น'} · {analysis.data_quality.note}
            </p>
            <ul className="rule-list">
              {analysis.insights.map((i, n) => (
                <li key={n} className="rule-item">
                  <span className="badge sev-info">{LEVEL[i.evidence_level] ?? i.evidence_level} · มั่นใจ{CONF[i.confidence] ?? ''}</span>
                  <div><strong>{i.observation}</strong><div className="muted">{i.interpretation}</div></div>
                </li>
              ))}
            </ul>
            <div className="card">
              <p className="eyebrow">การทดลองถัดไปที่แนะนำ</p>
              <p><strong>สมมติฐาน:</strong> {analysis.next_experiment.hypothesis}</p>
              <p><strong>สัญญาณที่คาดว่าจะเห็น:</strong> {analysis.next_experiment.expected_signal}</p>
              <p><strong>เกณฑ์ตัดสินใจ:</strong> {analysis.next_experiment.decision_rule}</p>
            </div>
          </div>
        ) : (
          <p className="muted">ยังไม่เคยวิเคราะห์ — กดปุ่มด้านล่างเพื่อเริ่ม</p>
        )}
        <AnalyzeForm workspaceSlug={workspaceSlug} />
      </section>

      <section className="card stack" aria-labelledby="s2">
        <h2 id="s2">2. สร้างร่างโฆษณา</h2>
        <GenerateForm
          workspaceSlug={workspaceSlug}
          segments={(segs.data ?? []).map((s) => ({ id: s.id, label: s.name, recommended: s.code === analysis?.recommended_segment_code }))}
          pillars={(pils.data ?? []).map((p) => ({ id: p.id, label: p.name, recommended: p.code === analysis?.recommended_pillar_code }))}
        />
      </section>

      <section className="card stack" aria-labelledby="s3">
        <h2 id="s3">3. ร่างโฆษณาล่าสุด</h2>
        {(drafts.data ?? []).length === 0 ? (
          <p className="muted">ยังไม่มีร่าง</p>
        ) : (
          <ul className="rule-list">
            {drafts.data!.map((d) => {
              const st = STATUS[d.status] ?? { label: d.status, cls: 'badge sev-info' };
              return (
                <li key={d.id} className="rule-item">
                  <span className={st.cls}>{st.label}</span>
                  <div>
                    <Link href={`/${workspaceSlug}/content/${d.id}`}><strong>{d.title}</strong></Link>
                    <div className="muted">{d.primary_channel} · {new Date(d.created_at).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
