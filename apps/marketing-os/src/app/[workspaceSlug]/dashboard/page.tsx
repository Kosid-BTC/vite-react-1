import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type DashboardProps = {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ visualQa?: string | string[] }>;
};

type CampaignRow = {
  id: string;
  name: string;
  objective: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

type ContentRow = {
  id: string;
  title: string;
  content_type: string | null;
  primary_channel: string | null;
  status: string;
  created_at: string;
};

type ActionRow = {
  id: string;
  title: string;
  description: string | null;
  priority: number | null;
  status: string;
  action_href: string | null;
  due_at: string | null;
  created_at: string;
};

type SegmentRow = {
  id: string;
  name: string;
  code: string;
  evidence_status: string;
};

type EvidenceRow = {
  id: string;
  content_item_id: string | null;
  evidence_kind: string;
  outcome_key: string;
  truth_status: string;
  created_at: string;
};

type TrackingRow = {
  id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
};

const metrics = [
  { label: 'Campaign Performance', icon: '◈' },
  { label: 'Content Published', icon: '▤' },
  { label: 'Verified Outcomes', icon: '✓' },
  { label: 'Audience Insights', icon: '◎' },
  { label: 'Tracking Links', icon: '↗' },
  { label: 'Connected Channels', icon: '⌁' },
];

const sidebarGroups = [
  { title: '', items: [{ label: 'Overview', href: 'home' }, { label: 'Campaign Dashboard', href: 'dashboard' }] },
  { title: 'STRATEGY', items: [{ label: 'Audience', href: 'strategy' }, { label: 'Business Genome', href: 'strategy' }, { label: 'MIT 24 Steps', href: 'strategy' }] },
  { title: 'CONTENT FACTORY', items: [{ label: 'Content Calendar', href: 'content' }, { label: 'Content Items', href: 'content' }] },
  { title: 'APPROVAL', items: [{ label: 'Review & Approve', href: 'approvals' }] },
  { title: 'DISTRIBUTION', items: [{ label: 'Channels', href: 'content' }, { label: 'UTM & Tracking', href: 'content' }] },
  { title: 'ANALYTICS', items: [{ label: 'Campaigns', href: 'campaigns' }, { label: 'Campaign Performance', href: 'dashboard' }, { label: 'Attribution', href: 'dashboard' }] },
];

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString('th-TH') : 'UNAVAILABLE';

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="empty-state detail-empty-state">{children}</p>;
}

export default async function DashboardPage({ params, searchParams }: DashboardProps) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const visualQaToken = Array.isArray(query.visualQa) ? query.visualQa[0] : query.visualQa;
  const isPreviewVisualQa =
    workspaceSlug === 'visual-qa' &&
    process.env.VERCEL_ENV === 'preview' &&
    Boolean(process.env.VERCEL_GIT_COMMIT_SHA) &&
    visualQaToken === process.env.VERCEL_GIT_COMMIT_SHA;

  let workspaceName = 'CEO AI Thailand';
  let campaigns: CampaignRow[] = [];
  let contentItems: ContentRow[] = [];
  let actionItems: ActionRow[] = [];
  let audienceSegments: SegmentRow[] = [];
  let evidenceItems: EvidenceRow[] = [];
  let trackingLinks: TrackingRow[] = [];

  if (!isPreviewVisualQa) {
    const db = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError) throw authError;
    if (!user) redirect('/login?next=/' + workspaceSlug + '/dashboard');

    const workspaceResult = await db
      .from('workspaces')
      .select('id,name,slug')
      .eq('slug', workspaceSlug)
      .maybeSingle();

    if (workspaceResult.error) throw workspaceResult.error;
    if (!workspaceResult.data) {
      return (
        <main className="shell stack" style={{ maxWidth: 760, paddingTop: 48 }}>
          <p className="eyebrow">CEO AI Thailand · Marketing OS</p>
          <h1>Campaign Dashboard</h1>
          <section className="card stack">
            <strong>Workspace data: UNAVAILABLE</strong>
            <p className="muted">ไม่พบ Workspace ที่บัญชีนี้มีสิทธิ์เข้าถึง ระบบจะไม่เลือก Workspace อื่นแทนโดยอัตโนมัติ</p>
            <Link href="/login">กลับไปเข้าสู่ระบบ</Link>
          </section>
        </main>
      );
    }

    workspaceName = workspaceResult.data.name;

    const [campaignResult, contentResult, actionResult, segmentResult, evidenceResult, trackingResult] = await Promise.all([
      db.from('marketing_campaigns')
        .select('id,name,objective,status,starts_at,ends_at,created_at')
        .eq('workspace_id', workspaceResult.data.id)
        .order('created_at', { ascending: false })
        .limit(8),
      db.from('marketing_content_items')
        .select('id,title,content_type,primary_channel,status,created_at')
        .eq('workspace_id', workspaceResult.data.id)
        .order('created_at', { ascending: false })
        .limit(8),
      db.from('marketing_action_items')
        .select('id,title,description,priority,status,action_href,due_at,created_at')
        .eq('workspace_id', workspaceResult.data.id)
        .order('priority', { ascending: false })
        .limit(8),
      db.from('marketing_audience_segments')
        .select('id,name,code,evidence_status')
        .eq('workspace_id', workspaceResult.data.id)
        .order('created_at', { ascending: false })
        .limit(8),
      db.from('marketing_evidence')
        .select('id,content_item_id,evidence_kind,outcome_key,truth_status,created_at')
        .eq('workspace_id', workspaceResult.data.id)
        .order('created_at', { ascending: false })
        .limit(12),
      db.from('marketing_tracking_links')
        .select('id,utm_source,utm_medium,utm_campaign,created_at')
        .eq('workspace_id', workspaceResult.data.id)
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    if (campaignResult.error) throw campaignResult.error;
    if (contentResult.error) throw contentResult.error;
    if (actionResult.error) throw actionResult.error;
    if (segmentResult.error) throw segmentResult.error;
    if (evidenceResult.error) throw evidenceResult.error;
    if (trackingResult.error) throw trackingResult.error;

    campaigns = (campaignResult.data ?? []) as CampaignRow[];
    contentItems = (contentResult.data ?? []) as ContentRow[];
    actionItems = (actionResult.data ?? []) as ActionRow[];
    audienceSegments = (segmentResult.data ?? []) as SegmentRow[];
    evidenceItems = (evidenceResult.data ?? []) as EvidenceRow[];
    trackingLinks = (trackingResult.data ?? []) as TrackingRow[];
  }

  const evidenceByContent = new Map<string, EvidenceRow[]>();
  for (const evidence of evidenceItems) {
    if (!evidence.content_item_id) continue;
    const rows = evidenceByContent.get(evidence.content_item_id) ?? [];
    rows.push(evidence);
    evidenceByContent.set(evidence.content_item_id, rows);
  }

  return (
    <main className="marketing-app-shell detail-dashboard-shell" data-visual-qa={isPreviewVisualQa ? 'preview-fixture' : undefined}>
      <aside className="app-sidebar" aria-label="เมนูหลัก">
        <div className="brand-lockup">
          <div className="brand-logo-window">
            <Image className="brand-reference-logo" src="/ceo-ai-reference-logo.svg" alt="CEO AI Thailand" width={153} height={60} priority />
          </div>
          <span className="sidebar-menu-icon" aria-hidden="true">☷</span>
        </div>
        <nav className="sidebar-nav">
          {sidebarGroups.map((group) => (
            <section className="sidebar-group" key={group.title || 'overview'}>
              {group.title && <p className="sidebar-section-title">{group.title}</p>}
              {group.items.map((item) => (
                <Link
                  className={`sidebar-item ${item.href === 'dashboard' ? 'active' : ''}`}
                  href={`/${workspaceSlug}/${item.href}`}
                  key={item.label}
                >
                  <span className="sidebar-dot" />{item.label}
                </Link>
              ))}
            </section>
          ))}
        </nav>
        <section className="environment-card">
          <div className="environment-row"><span>Environment</span><strong>{(process.env.VERCEL_ENV ?? 'local').toUpperCase()}</strong></div>
          <small>Workspace</small>
          <p>{workspaceName}</p>
          <span className="health-line">Data scope: workspace</span>
          <div className="system-settings-row">⚙ System Settings</div>
        </section>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <div className="global-search" aria-label="Global search placeholder">⌕ <span>Search campaigns, content, or anything...</span></div>
          <div className="topbar-actions">
            <span className="notification" aria-label="Notifications">♧<b>0</b></span>
            <div className="profile-avatar" aria-hidden="true">AI</div>
            <div className="profile-copy"><strong>Workspace Member</strong><small>Marketing OS</small></div>
            <span className="profile-chevron" aria-hidden="true">⌄</span>
          </div>
        </header>

        <div className="dashboard-content detail-dashboard-content">
          <section className="dashboard-title-row detail-title-row">
            <div><h1>Campaign Dashboard</h1><p>CEO AI Thailand · Campaign & Content Performance</p></div>
            <div className="title-actions">
              <span className="date-filter">30 วันล่าสุด ▣</span>
              <Link className="reference-primary" href={`/${workspaceSlug}/campaigns/new`}>＋ สร้าง Campaign</Link>
            </div>
          </section>

          <section className="detail-workspace-strip" aria-label="Workspace and data scope">
            <span><strong>Workspace</strong> {workspaceName}</span>
            <span><strong>Data provenance</strong> {isPreviewVisualQa ? 'PREVIEW FIXTURE' : 'WORKSPACE-SCOPED'}</span>
            <span><strong>Performance evidence</strong> UNAVAILABLE until verified</span>
          </section>

          <section className="metric-grid detail-metric-grid" aria-label="Campaign and content KPIs">
            {metrics.map((metric) => (
              <article className="metric-card detail-metric-card" key={metric.label}>
                <div className="metric-head">
                  <span className="metric-icon metric-icon-blue">{metric.icon}</span>
                  <span className="metric-label">{metric.label}</span>
                </div>
                <div className="metric-value-row">
                  <strong className="metric-value">—</strong>
                  <span className="truth-chip">UNAVAILABLE</span>
                </div>
                <p className="metric-foot">ยังไม่มีหลักฐานผลลัพธ์ที่ยืนยันได้</p>
              </article>
            ))}
          </section>

          <section className="detail-main-grid" aria-label="Detailed campaign and content dashboard">
            <article className="panel detail-panel detail-campaign-performance" data-order="1">
              <div className="panel-heading compact"><div><h2>Campaign Performance</h2><p>ผลลัพธ์แคมเปญจากหลักฐานที่ตรวจสอบได้</p></div><span className="detail-state">UNAVAILABLE</span></div>
              {campaigns.length ? (
                <div className="detail-campaign-list">
                  {campaigns.map((campaign) => (
                    <div className="detail-campaign-row" key={campaign.id}>
                      <div><strong>{campaign.name}</strong><small>{campaign.objective || 'Objective: UNAVAILABLE'}</small></div>
                      <span className="detail-status">{campaign.status.toUpperCase()}</span>
                      <span className="detail-value">—</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState>ยังไม่มี Campaign ที่ยืนยันได้ใน Workspace นี้</EmptyState>}
              <p className="detail-evidence-note">Performance values remain — until source evidence is verified.</p>
            </article>

            <article className="panel detail-panel detail-top-content" data-order="2">
              <div className="panel-heading compact"><div><h2>Top Performing Content</h2><p>จัดอันดับได้เมื่อมี outcome evidence</p></div><span className="detail-state">UNAVAILABLE</span></div>
              <EmptyState>ยังไม่มีหลักฐานผลลัพธ์ที่เพียงพอสำหรับจัดอันดับ Content</EmptyState>
              <div className="detail-content-hints">
                <span>Content records: {contentItems.length ? String(contentItems.length) : '—'}</span>
                <span>Verified ranking: UNAVAILABLE</span>
              </div>
            </article>

            <article className="panel detail-panel detail-channels" data-order="3">
              <div className="panel-heading compact"><div><h2>Channels & Integrations</h2><p>สถานะการเชื่อมต่อที่ยืนยันได้</p></div><span className="detail-state">UNVERIFIED</span></div>
              <div className="detail-channel-grid">
                {['Website', 'Facebook', 'YouTube'].map((channel) => (
                  <div className="detail-channel-card" key={channel}><strong>{channel}</strong><span>UNVERIFIED</span></div>
                ))}
              </div>
              <p className="detail-evidence-note">Tracking links: {trackingLinks.length ? String(trackingLinks.length) : '—'} · Connection health: UNVERIFIED</p>
            </article>

            <article className="panel detail-panel detail-content-calendar" data-order="4">
              <div className="panel-heading compact"><div><h2>Content Calendar / Factory</h2><p>รายการ Content จริงใน Workspace</p></div><Link href={`/${workspaceSlug}/content`}>ดู Content</Link></div>
              {contentItems.length ? (
                <div className="detail-content-list">
                  {contentItems.slice(0, 5).map((item) => (
                    <div className="detail-content-row" key={item.id}>
                      <div><strong>{item.title}</strong><small>{item.content_type || 'Type: UNAVAILABLE'} · {item.primary_channel || 'Channel: UNAVAILABLE'}</small></div>
                      <span className="detail-status">{item.status.toUpperCase()}</span>
                      <small>Created {formatDate(item.created_at)}</small>
                    </div>
                  ))}
                </div>
              ) : <EmptyState>ยังไม่มี Content Item ใน Workspace นี้</EmptyState>}
              <p className="detail-evidence-note">Publishing schedule: UNAVAILABLE unless a verified schedule record exists.</p>
            </article>

            <article className="panel detail-panel detail-audience-insights" data-order="5">
              <div className="panel-heading compact"><div><h2>Audience Insights</h2><p>Segments and evidence status</p></div><span className="detail-state">EVIDENCE-LED</span></div>
              {audienceSegments.length ? (
                <div className="detail-content-list">
                  {audienceSegments.slice(0, 5).map((segment) => (
                    <div className="detail-content-row" key={segment.id}>
                      <div><strong>{segment.name}</strong><small>{segment.code}</small></div>
                      <span className="detail-status">{segment.evidence_status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState>ยังไม่มี Audience Segment ที่ตรวจสอบได้</EmptyState>}
            </article>

            <article className="panel detail-panel detail-ai-insight" data-order="6">
              <div className="panel-heading compact"><div><h2>AI Insight</h2><p>Evidence → Diagnosis → Recommendation</p></div><span className="detail-state">UNAVAILABLE</span></div>
              <EmptyState>AI จะไม่สรุป Insight จนกว่าจะมี Evidence ที่ตรวจสอบได้</EmptyState>
              <p className="detail-evidence-note">Evidence records: {evidenceItems.length ? String(evidenceItems.length) : '—'} · Evidence status is retained per record.</p>
            </article>

            <article className="panel detail-panel detail-next-actions" data-order="7">
              <div className="panel-heading compact"><div><h2>Next Best Actions</h2><p>AI proposes; human approval remains required</p></div><span className="detail-state">REVIEW ONLY</span></div>
              {actionItems.length ? (
                <div className="detail-content-list">
                  {actionItems.slice(0, 5).map((action) => (
                    <div className="detail-content-row" key={action.id}>
                      <div><strong>{action.title}</strong><small>{action.description || 'No description supplied'}</small></div>
                      <span className="detail-status">{action.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState>ยังไม่มี Next Best Action ที่มีหลักฐานเพียงพอ</EmptyState>}
            </article>

            <article className="panel detail-panel detail-business-genome" data-order="8">
              <div className="panel-heading compact"><div><h2>Business Genome</h2><p>Business model and growth context</p></div><span className="detail-state">UNAVAILABLE</span></div>
              <div className="detail-placeholder-grid">
                {['Target Market', 'Value Proposition', 'Growth Strategy', 'Key Differentiator'].map((label) => (
                  <div key={label}><small>{label}</small><strong>UNAVAILABLE</strong></div>
                ))}
              </div>
            </article>

            <article className="panel detail-panel detail-mit-steps" data-order="9">
              <div className="panel-heading compact"><div><h2>MIT 24 Steps</h2><p>24-step execution framework</p></div><span className="detail-state">UNAVAILABLE</span></div>
              <div className="detail-mit-summary"><strong>—</strong><span>/24 steps verified</span></div>
              <EmptyState>ยังไม่มี Step completion evidence ใน Workspace นี้</EmptyState>
            </article>

            <article className="panel detail-panel detail-activity" data-order="10">
              <div className="panel-heading compact"><div><h2>Recent Activity</h2><p>Workspace-scoped records</p></div><span className="detail-state">LIVE DATA ONLY</span></div>
              {actionItems.length ? (
                <div className="detail-content-list">
                  {actionItems.slice(0, 4).map((action) => (
                    <div className="detail-content-row" key={action.id}>
                      <div><strong>{action.title}</strong><small>{formatDate(action.created_at)}</small></div>
                      <span className="detail-status">{action.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState>ยังไม่มีกิจกรรมที่มีหลักฐานใน Workspace นี้</EmptyState>}
            </article>

            <article className="panel detail-panel detail-platform-status" data-order="11">
              <div className="panel-heading compact"><div><h2>Platform Status</h2><p>Integration health and data provenance</p></div><span className="detail-state">UNVERIFIED</span></div>
              <div className="detail-channel-grid">
                <div className="detail-channel-card"><strong>Supabase workspace query</strong><span>RLS-SCOPED</span></div>
                <div className="detail-channel-card"><strong>Landing Page</strong><span>UNVERIFIED</span></div>
                <div className="detail-channel-card"><strong>Attribution</strong><span>{trackingLinks.length ? 'TRACKING RECORDS PRESENT' : 'UNAVAILABLE'}</span></div>
              </div>
            </article>
          </section>

          <footer className="dashboard-footer"><span>CEO AI Thailand · Marketing OS · Approved UX/UI V4</span><span>Evidence-first · Human approval for material actions</span></footer>
        </div>
      </section>
    </main>
  );
}
