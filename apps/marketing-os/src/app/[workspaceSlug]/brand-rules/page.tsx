import { getMarketingRepository } from '@/server/services';
import { ruleTypeLabel, severityMeta } from '@/lib/severity';
import { readOrDenied } from '@/lib/supabase/errors';

export const dynamic = 'force-dynamic';

// Repoint acceptance check (OS-APP-REPOINT-CHECKLIST §6): reads marketing_os on waigsnxhrlwtiotspaim.
// สัญญาณที่วัดได้ (ADR-0016): audience_segments = 6 (ของเขา) ไม่ใช่ 5 (public ของเรา)
// brand_rules: สมาชิกอ่านได้ (0075) · คนที่ไม่ใช่สมาชิกได้ 42501 ⇒ เห็นข้อความแทนตัวเลข
export default async function BrandRulesPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const repo = await getMarketingRepository();
  const workspace = await repo.getWorkspaceBySlug(workspaceSlug);
  const [rulesRes, segments] = await Promise.all([
    readOrDenied(() => repo.getBrandRules(workspace.id)),
    repo.getAudienceSegments(workspace.id),
  ]);
  const rules = rulesRes.ok ? rulesRes.data : [];

  // Von Restorff + Serial Position: ข้อห้ามเด็ดขาดขึ้นก่อนเสมอ
  const sorted = [...rules].sort((a, b) => severityMeta(a.severity).rank - severityMeta(b.severity).rank);
  const blockingCount = rules.filter((r) => r.severity === 'blocking').length;

  return (
    <main className="shell stack">
      <header>
        <p className="eyebrow">กฎแบรนด์ · {workspace.name}</p>
        <h1>สิ่งที่คอนเทนต์ทุกชิ้นต้องผ่าน</h1>
        <p className="muted">
          {rulesRes.ok ? (
            <><strong data-testid="brand-rules-count">{rules.length}</strong> กฎ (ห้ามเด็ดขาด {blockingCount}) ·{' '}</>
          ) : (
            <>กฎแบรนด์: ยังไม่เปิดสิทธิ์ ·{' '}</>
          )}
          <strong data-testid="segments-count">{segments.length}</strong> กลุ่มเป้าหมาย
        </p>
      </header>

      <section className="card stack" aria-labelledby="rules-heading">
        <h2 id="rules-heading">กฎแบรนด์{rulesRes.ok ? ` (${rules.length})` : ''}</h2>
        {!rulesRes.ok && (
          <p className="notice" role="status">
            บัญชีนี้ยังอ่านกฎแบรนด์ไม่ได้ — ต้องเป็นสมาชิกของ workspace นี้ (migration 0075)
          </p>
        )}
        <ul className="rule-list">
          {sorted.map((r) => {
            const sev = severityMeta(r.severity);
            return (
              <li key={r.id} className={`rule-item is-${r.severity}`}>
                <span className={sev.className}>
                  <span aria-hidden="true">{sev.icon}</span>&nbsp;{sev.label}
                </span>
                <div>
                  <strong>{ruleTypeLabel(r.rule_type)}</strong>
                  {r.description && <div>{r.description}</div>}
                  {!r.active && <em className="muted">(ปิดใช้งาน)</em>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card stack" aria-labelledby="segments-heading">
        <h2 id="segments-heading">กลุ่มเป้าหมาย ({segments.length})</h2>
        <ul>
          {segments.map((s) => (
            <li key={s.id}>
              {s.name} <span className="muted">· {s.evidence_status === 'hypothesis' ? 'ยังเป็นสมมติฐาน' : s.evidence_status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
