import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { reviewApprovalAction } from './actions';

type ApprovalsPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function ApprovalsPage({ params }: ApprovalsPageProps) {
  const { workspaceSlug } = await params;
  const db = await createSupabaseServerClient();
  const workspaceResult = await db.from('workspaces').select('id,name,slug').eq('slug', workspaceSlug).maybeSingle();

  if (workspaceResult.error || !workspaceResult.data) {
    return (
      <main className="shell stack" style={{ maxWidth: 960, paddingTop: 40 }}>
        <h1>Review & Approve</h1>
        <div className="card" style={{ padding: 16 }}>
          <strong>Data status: UNAVAILABLE</strong>
          <p className="muted" style={{ marginBottom: 0 }}>{workspaceResult.error?.message ?? 'ไม่พบ Workspace'}</p>
        </div>
      </main>
    );
  }

  const workspace = workspaceResult.data;
  const approvals = await db
    .from('marketing_approval_requests')
    .select('id,content_item_id,content_version_id,status,requested_by,reviewed_by,review_notes,created_at,reviewed_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (approvals.error) {
    return (
      <main className="shell stack" style={{ maxWidth: 960, paddingTop: 40 }}>
        <h1>Review & Approve</h1>
        <div className="card" style={{ padding: 16 }}>
          <strong>Data status: UNAVAILABLE</strong>
          <p className="muted" style={{ marginBottom: 0 }}>{approvals.error.message}</p>
        </div>
      </main>
    );
  }

  const approvalRows = approvals.data ?? [];
  const contentIds = [...new Set(approvalRows.map((item) => item.content_item_id))];
  const contents = contentIds.length > 0
    ? await db.from('marketing_content_items').select('id,title,content_type,status').eq('workspace_id', workspace.id).in('id', contentIds)
    : { data: [], error: null };

  const titleById = new Map((contents.data ?? []).map((item) => [item.id, item]));
  const pendingCount = approvalRows.filter((item) => item.status === 'pending').length;

  return (
    <main className="shell stack" style={{ maxWidth: 1080, paddingTop: 40, paddingBottom: 64, gap: 20 }}>
      <header className="stack" style={{ gap: 8 }}>
        <p className="eyebrow">Approval</p>
        <h1 style={{ margin: 0 }}>Review & Approve</h1>
        <p className="muted" style={{ margin: 0 }}>
          {workspace.name} · Human approval gate · Pending {pendingCount}
        </p>
      </header>

      <div className="card" style={{ padding: 16 }}>
        <strong>Approval status: {approvalRows.length === 0 ? 'EMPTY' : 'LIVE'}</strong>
        <p className="muted" style={{ marginBottom: 0 }}>
          การอนุมัติ/ปฏิเสธจะบันทึก reviewer และเวลาใน Supabase และถูกบังคับสิทธิ์ด้วย RLS `can_review_workspace`.
        </p>
      </div>

      {approvalRows.length === 0 ? (
        <div className="card" style={{ padding: 20 }}>
          <strong>ยังไม่มีคำขออนุมัติ</strong>
          <p className="muted" style={{ marginBottom: 0 }}>สร้าง Content Object แล้วส่งเข้าคิวตรวจจากหน้า Content Detail</p>
        </div>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {approvalRows.map((approval) => {
            const content = titleById.get(approval.content_item_id);
            return (
              <article key={approval.id} className="card stack" style={{ padding: 18, gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div className="stack" style={{ gap: 4 }}>
                    <strong>{content?.title ?? `Content ${approval.content_item_id}`}</strong>
                    <span className="muted">{content?.content_type ?? 'content'} · Request {new Date(approval.created_at).toLocaleString('th-TH')}</span>
                    {approval.review_notes && <span className="muted">Note: {approval.review_notes}</span>}
                  </div>
                  <span className="eyebrow">{approval.status.toUpperCase()}</span>
                </div>

                {approval.status === 'pending' ? (
                  <form action={reviewApprovalAction} className="stack" style={{ gap: 10 }}>
                    <input type="hidden" name="workspaceSlug" value={workspaceSlug} />
                    <input type="hidden" name="approvalId" value={approval.id} />
                    <label className="field">
                      <span>Review note</span>
                      <textarea name="reviewNotes" maxLength={1200} placeholder="เหตุผลหรือเงื่อนไขในการอนุมัติ" />
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button className="primary" type="submit" name="decision" value="approved">Approve</button>
                      <button className="secondary" type="submit" name="decision" value="changes_requested">Request changes</button>
                      <button className="secondary" type="submit" name="decision" value="rejected">Reject</button>
                    </div>
                  </form>
                ) : (
                  <small className="muted">
                    {approval.reviewed_at ? `Reviewed ${new Date(approval.reviewed_at).toLocaleString('th-TH')}` : 'Review recorded'}
                  </small>
                )}

                <Link href={`/${workspaceSlug}/content/${approval.content_item_id}`}>เปิด Content Detail</Link>
              </article>
            );
          })}
        </div>
      )}

      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Link className="primary" href={`/${workspaceSlug}/content/new`}>สร้าง Content</Link>
        <Link href={`/${workspaceSlug}/home`}>กลับ Dashboard</Link>
      </nav>
    </main>
  );
}
