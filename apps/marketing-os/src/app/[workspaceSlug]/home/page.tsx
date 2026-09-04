import Image from 'next/image';
import Link from 'next/link';
import { getMarketingService } from '@/server/services';

type SidebarNavItem = {
  label: string;
  key?: 'dashboard' | 'campaigns';
};

type SidebarGroup = {
  title: string;
  items: SidebarNavItem[];
};

const metrics = [
  { icon: '◎', label: 'Website Visitors', accent: 'blue' },
  { icon: 'f', label: 'Facebook Reach', accent: 'blue' },
  { icon: '▶', label: 'YouTube Views', accent: 'red' },
  { icon: '●', label: 'Leads (Qualified)', accent: 'green' },
  { icon: '◉', label: 'Conversion Rate', accent: 'pink' },
  { icon: '฿', label: 'Revenue (Estimate)', accent: 'green' },
] as const;

const sidebarGroups: SidebarGroup[] = [
  { title: '', items: [{ label: 'Dashboard', key: 'dashboard' }] },
  { title: 'STRATEGY', items: [{ label: 'Audience' }, { label: 'Message Pillars' }, { label: 'Brand Guardrails' }] },
  { title: 'CONTENT FACTORY', items: [{ label: 'Content Calendar' }, { label: 'Content Items' }, { label: 'Create Content' }] },
  { title: 'APPROVAL', items: [{ label: 'Review & Approve' }, { label: 'Content Library' }] },
  { title: 'DISTRIBUTION', items: [{ label: 'Channels' }, { label: 'Publishing' }, { label: 'UTM & Tracking' }] },
  { title: 'ANALYTICS', items: [{ label: 'Overview' }, { label: 'Campaigns', key: 'campaigns' }, { label: 'Content Performance' }, { label: 'Audience Insights' }, { label: 'Attribution' }] },
  { title: 'EXPERIMENTS', items: [{ label: 'A/B Tests' }] },
  { title: 'AI INSIGHTS', items: [{ label: 'Business Genome' }, { label: 'Next Best Actions' }] },
  { title: 'SYSTEM', items: [{ label: 'Environment' }, { label: 'Migration' }, { label: 'RLS / Security' }, { label: 'Supabase Staging' }, { label: 'Production Readiness' }] },
];

function Sparkline({ accent }: { accent: string }) {
  return (
    <svg className={`sparkline sparkline-${accent}`} viewBox="0 0 150 34" aria-hidden="true">
      <polyline points="2,27 18,23 32,24 47,16 62,19 76,10 91,13 108,7 123,16 138,11 148,15" />
    </svg>
  );
}

function MetricCard({ icon, label, accent }: { icon: string; label: string; accent: string }) {
  return (
    <article className="metric-card">
      <div className="metric-head">
        <span className={`metric-icon metric-icon-${accent}`}>{icon}</span>
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value-row">
        <strong className="metric-value">—</strong>
        <span className="truth-chip">UNAVAILABLE</span>
      </div>
      <Sparkline accent={accent} />
      <p className="metric-foot">ยังไม่มีหลักฐาน Production สำหรับช่วงเวลานี้</p>
    </article>
  );
}

export default async function HomePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const service = await getMarketingService();
  const data = await service.getHome(workspaceSlug);
  const recommendationQueue = [data.primaryAction, ...data.actions.filter((action) => action.id !== data.primaryAction.id)].slice(0, 5);
  const environmentLabel = (process.env.VERCEL_ENV ?? 'local').toUpperCase();

  return (
    <main className="marketing-app-shell">
      <aside className="app-sidebar" aria-label="เมนูหลัก">
        <div className="brand-lockup">
          <div className="brand-logo-window">
            <Image
              className="brand-reference-logo"
              src="/ceo-ai-reference-logo.svg"
              alt="CEO AI Thailand"
              width={153}
              height={60}
              priority
            />
          </div>
          <span className="sidebar-menu-icon" aria-hidden="true">☷</span>
        </div>

        <nav className="sidebar-nav">
          {sidebarGroups.map((group, groupIndex) => (
            <section className="sidebar-group" key={`${group.title}-${groupIndex}`}>
              {group.title && <p className="sidebar-section-title">{group.title}</p>}
              {group.items.map((item) => {
                const href = item.key === 'dashboard'
                  ? `/${workspaceSlug}/home`
                  : item.key === 'campaigns'
                    ? `/${workspaceSlug}/campaigns`
                    : null;
                const active = item.key === 'dashboard';

                return href ? (
                  <Link className={`sidebar-item ${active ? 'active' : ''}`} href={href} key={item.label}>
                    <span className="sidebar-dot" />{item.label}
                  </Link>
                ) : (
                  <span className="sidebar-item muted-item" aria-disabled="true" key={item.label}>
                    <span className="sidebar-dot" />{item.label}
                  </span>
                );
              })}
              {group.title === 'CONTENT FACTORY' && (
                <div className="sidebar-subitems" aria-label="Create Content">
                  <span>Text to Image</span><span>Text to Video</span><span>Image to Video</span>
                </div>
              )}
            </section>
          ))}
        </nav>

        <section className="environment-card">
          <div className="environment-row">
            <span>Environment</span>
            <strong>{environmentLabel}</strong>
          </div>
          <small>Workspace</small>
          <p>{data.workspace.name}</p>
          <span className="health-line">● Workspace data connected</span>
          <div className="system-settings-row">⚙ System Settings</div>
        </section>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <div className="global-search" aria-label="Global search placeholder">⌕ <span>Search campaigns, content, or anything...</span></div>
          <div className="topbar-actions">
            <span className="notification" aria-label="Notifications">♧<b>0</b></span>
            <div className="profile-avatar" aria-hidden="true">TC</div>
            <div className="profile-copy"><strong>Tanawat C.</strong><small>Marketing Admin</small></div>
            <span className="profile-chevron" aria-hidden="true">⌄</span>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-title-row">
            <div>
              <h1>CEO AI Thailand</h1>
              <p>Marketing OS</p>
            </div>
            <div className="title-actions">
              <span className="date-filter">30 วันล่าสุด　▣</span>
              <Link className="reference-primary" href={`/${workspaceSlug}/campaigns/new`}>＋ สร้างแคมเปญใหม่</Link>
            </div>
          </section>

          <section className="welcome-row">
            <div className="welcome-copy">
              <h2>สวัสดีครับ Tanawat</h2>
              <p>นี่คือภาพรวมการตลาดของคุณวันนี้ พร้อมคำแนะนำจาก AI</p>
            </div>
            <div className="connection-strip" aria-label="สถานะระบบเชื่อมต่อ">
              <span className="connection-pill ok">✓ Marketing OS พร้อมใช้งาน</span>
              <span className="connection-pill"><b>◎</b> Website <small>UNVERIFIED</small></span>
              <span className="connection-pill"><b>f</b> Facebook <small>UNVERIFIED</small></span>
              <span className="connection-pill"><b>▶</b> YouTube <small>UNVERIFIED</small></span>
              <span className="connection-pill genome"><b>◌</b> Business Genome <small>UNAVAILABLE</small></span>
            </div>
            <p className="brand-quote">“ให้ AI ทำงานแทนคุณ<br />เพื่อการเติบโตอย่างยั่งยืน”</p>
          </section>

          <section className="metric-grid" aria-label="Marketing KPIs">
            {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
          </section>

          <section className="dashboard-body-grid">
            <div className="dashboard-main-column">
              <article className="panel performance-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Performance Overview</h2>
                    <div className="tab-row"><span className="tab active">ภาพรวม</span><span className="tab">Website</span><span className="tab">Facebook</span><span className="tab">YouTube</span></div>
                  </div>
                  <span className="panel-filter">30 วันล่าสุด　⌄</span>
                </div>
                <div className="performance-body">
                  <div className="chart-area">
                    <div className="chart-legend"><span className="legend-purple">● Website Visitors</span><span className="legend-blue">● Facebook Reach</span><span className="legend-pink">● YouTube Views</span><span className="legend-green">● Leads</span></div>
                    <div className="empty-chart">
                      <svg viewBox="0 0 700 250" preserveAspectRatio="none" aria-hidden="true">
                        {[40, 85, 130, 175, 220].map((y) => <line key={y} x1="0" y1={y} x2="700" y2={y} />)}
                      </svg>
                      <div className="empty-chart-copy"><strong>ยังไม่มีข้อมูล Performance ที่วัดได้</strong><span>Measurement Health: UNAVAILABLE</span></div>
                    </div>
                  </div>
                  <aside className="traffic-source">
                    <h3>Traffic Sources</h3>
                    <div className="donut-empty"><span>—</span><small>Total Visitors</small></div>
                    <ul><li><i className="facebook" />Facebook <b>—</b></li><li><i className="youtube" />YouTube <b>—</b></li><li><i className="search" />Google Search <b>—</b></li><li><i className="direct" />Direct <b>—</b></li><li><i className="other" />Other <b>—</b></li></ul>
                  </aside>
                </div>
              </article>

              <div className="dashboard-lower-grid">
                <article className="panel genome-panel">
                  <div className="panel-heading compact"><div><h2>◉ Business Genome</h2><p>ตัวแบบธุรกิจและกลยุทธ์ของคุณ</p></div><span className="status-active">Evidence required</span></div>
                  <div className="genome-body">
                    <div className="dna-placeholder">DNA</div>
                    <div className="genome-fields">
                      <div><small>Latest Version</small><strong>UNAVAILABLE</strong></div>
                      <div><small>Target Market</small><strong>ยังไม่มีหลักฐาน</strong></div>
                      <div><small>Value Proposition</small><strong>ยังไม่มีหลักฐาน</strong></div>
                      <div><small>Growth Strategy</small><strong>ยังไม่มีหลักฐาน</strong></div>
                      <div><small>Key Differentiator</small><strong>ยังไม่มีหลักฐาน</strong></div>
                    </div>
                  </div>
                </article>

                <article className="panel mit-panel">
                  <div className="panel-heading compact"><div><h2>▣ MIT 24 Steps</h2><p>แผนการดำเนินงาน 24 ขั้นตอน</p></div><span>ดูทั้งหมด</span></div>
                  <div className="mit-body">
                    <div className="progress-ring"><strong>—</strong><small>/24</small></div>
                    <ol><li>Market Research <span>UNAVAILABLE</span></li><li>Customer Analysis <span>UNAVAILABLE</span></li><li>Positioning <span>UNAVAILABLE</span></li><li>Content Strategy <span>UNAVAILABLE</span></li><li>Channel Setup <span>UNAVAILABLE</span></li><li>Campaign Launch <span>UNAVAILABLE</span></li></ol>
                  </div>
                </article>
              </div>

              <section className="panel platform-panel">
                <div className="panel-heading compact"><div><h2>การเชื่อมต่อกับแพลตฟอร์ม</h2><p>เชื่อมต่อแล้ว 0/3 แพลตฟอร์มที่มีหลักฐานยืนยันใน Dashboard</p></div></div>
                <div className="platform-grid"><div><b>◎</b><span><strong>Website</strong><small>UNVERIFIED</small></span></div><div><b>f</b><span><strong>Facebook</strong><small>UNVERIFIED</small></span></div><div><b>▶</b><span><strong>YouTube</strong><small>UNVERIFIED</small></span></div></div>
              </section>
            </div>

            <aside className="dashboard-side-column">
              <section className="panel ai-panel">
                <div className="panel-heading compact"><h2>✦ AI แนะนำสำหรับคุณ</h2><span>ทั้งหมด</span></div>
                <div className="recommendation-list">
                  {recommendationQueue.map((action, index) => (
                    <article className="recommendation" key={action.id}>
                      <span className={`recommendation-icon r${(index % 4) + 1}`}>{index + 1}</span>
                      <div><strong>{action.title}</strong><p>{action.description || 'คำแนะนำนี้อ้างอิงจากงานที่มีอยู่ใน Workspace'}</p></div>
                      {action.action_href ? <Link href={action.action_href}>ดำเนินการ</Link> : <span className="disabled-action">UNAVAILABLE</span>}
                    </article>
                  ))}
                  {recommendationQueue.length === 0 && <p className="empty-state">ยังไม่มี Next Best Action ที่มีหลักฐานเพียงพอ</p>}
                </div>
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading compact"><h2>Recent Activity</h2><span>ทั้งหมด</span></div>
                <div className="activity-list">
                  {data.actions.slice(0, 5).map((action, index) => <div className="activity-item" key={action.id}><span>{index + 1}</span><div><strong>{action.title}</strong><p>{action.description || 'Workspace activity'}</p></div><small>LIVE</small></div>)}
                  {data.actions.length === 0 && <p className="empty-state">ยังไม่มีกิจกรรมล่าสุด</p>}
                </div>
                <div className="supabase-status-card"><span className="supabase-status-icon">↯</span><div><strong>Supabase</strong><p>Workspace data connection</p><small>● connected</small></div></div>
              </section>
            </aside>
          </section>

          <footer className="dashboard-footer"><span>CEO AI Thailand　·　Marketing OS　·　Reference UI V2</span><span>Powered by AI　|　Built for Sustainable Growth</span></footer>
        </div>
      </section>
    </main>
  );
}
