import Link from 'next/link';

export type ExecutiveGrowthAction = {
  id: string;
  title: string;
  description?: string | null;
  action_href?: string | null;
};

const sidebarItems = [
  'ภาพรวมธุรกิจ',
  'Growth Engine',
  'MIT 24 Steps',
  'Marketing OS',
  'ลูกค้าและ CRM',
  'การเงิน',
  'AI Workspace',
  'รายงาน',
] as const;

const unavailableKpis = [
  { label: 'Business Health', suffix: '/ 100' },
  { label: 'Leads เดือนนี้', suffix: '' },
  { label: 'Conversion', suffix: '%' },
  { label: 'MRR', suffix: '฿' },
] as const;

export function ExecutiveGrowthDashboard({
  workspaceName,
  actions,
}: {
  workspaceName: string;
  actions: ExecutiveGrowthAction[];
}) {
  const visibleActions = actions.slice(0, 3);

  return (
    <main className="eg-shell">
      <aside className="eg-sidebar" aria-label="Executive Growth navigation">
        <div className="eg-brand">
          <div className="eg-brand-mark" aria-hidden="true" />
          <div className="eg-brand-copy">
            <strong>CEO AI Thailand</strong>
            <small>EXECUTIVE GROWTH OS</small>
          </div>
        </div>

        <nav className="eg-nav">
          {sidebarItems.map((item, index) => (
            <div className={`eg-nav-item ${index === 0 ? 'active' : ''}`} key={item}>
              <span aria-hidden="true" />
              {item}
            </div>
          ))}
        </nav>

        <div className="eg-sidebar-spacer" />
        <div className="eg-copilot">AI Business Copilot</div>
      </aside>

      <section className="eg-main">
        <div className="eg-desktop">
          <header className="eg-page-head">
            <div>
              <h1>ภาพรวมธุรกิจ</h1>
              <p>{workspaceName} · ข้อมูลที่ยังไม่ยืนยันจะแสดงเป็น UNAVAILABLE</p>
            </div>
            <div className="eg-head-tools" aria-label="Executive controls">
              <span className="eg-head-tool">ค้นหา</span>
              <span className="eg-head-tool">แจ้งเตือน</span>
              <span className="eg-head-tool">บัญชีผู้ใช้งาน</span>
            </div>
          </header>

          <section className="eg-kpis" aria-label="Executive KPIs">
            {unavailableKpis.map((kpi) => (
              <article className="eg-card eg-kpi" key={kpi.label}>
                <div className="eg-kpi-label">
                  <span>{kpi.label}</span>
                  <span className="eg-change">UNAVAILABLE</span>
                </div>
                <div className="eg-kpi-value">— {kpi.suffix && <small>{kpi.suffix}</small>}</div>
                <div className="eg-kpi-foot"><span>Production evidence</span><span>ยังไม่มี</span></div>
                <div className="eg-mini-bar"><i /></div>
              </article>
            ))}
          </section>

          <section className="eg-primary-grid">
            <article className="eg-panel">
              <div className="eg-panel-head">
                <div>
                  <h2>Growth Activity</h2>
                  <p>Traffic, leads และ conversion 30 วันล่าสุด</p>
                </div>
                <div className="eg-tabs"><span className="eg-tab">Traffic</span><span className="eg-tab alt">Leads</span></div>
              </div>
              <div className="eg-growth-chart">
                <div className="eg-gridlines" aria-hidden="true" />
                <div className="eg-no-data"><strong>ยังไม่มีข้อมูล Growth Activity ที่ยืนยันแล้ว</strong><span>Measurement Health: UNAVAILABLE</span></div>
              </div>
            </article>

            <aside className="eg-side-stack">
              <article className="eg-health-dark">
                <small>Business Health</small>
                <div className="eg-health-score">— <span>/ 100</span></div>
                <div className="eg-mini-bar"><i /></div>
                <div className="eg-health-note">ยังไม่มีหลักฐานเพียงพอสำหรับคำนวณคะแนน</div>
              </article>

              <article className="eg-panel eg-actions">
                <div className="eg-panel-head"><h2>Next Best Actions</h2></div>
                <ol className="eg-action-list">
                  {visibleActions.map((action, index) => (
                    <li key={action.id}>
                      <span className="eg-action-index">{index + 1}</span>
                      <div className="eg-action-copy">
                        <strong>{action.title}</strong>
                        <small>{action.description || 'Human approval required before execution'}</small>
                      </div>
                      {action.action_href ? <Link className="eg-action-link" href={action.action_href}>เปิด</Link> : <span className="eg-action-link eg-unavailable">—</span>}
                    </li>
                  ))}
                </ol>
              </article>
            </aside>
          </section>

          <section className="eg-lower-grid">
            <article className="eg-card eg-small-panel">
              <h3>Conversion Funnel</h3>
              <div className="eg-rows">
                <div className="eg-row"><span>Visitors</span><span className="eg-unavailable">—</span></div>
                <div className="eg-row"><span>Leads</span><span className="eg-unavailable">—</span></div>
                <div className="eg-row"><span>Qualified</span><span className="eg-unavailable">—</span></div>
                <div className="eg-row"><span>Customers</span><span className="eg-unavailable">—</span></div>
              </div>
            </article>

            <article className="eg-card eg-small-panel">
              <h3>Acquisition Mix</h3>
              <div className="eg-rows">
                <div className="eg-row"><span>Organic</span><span className="eg-unavailable">—</span></div>
                <div className="eg-row"><span>Paid</span><span className="eg-unavailable">—</span></div>
                <div className="eg-row"><span>Referral</span><span className="eg-unavailable">—</span></div>
                <div className="eg-row"><span>Direct</span><span className="eg-unavailable">—</span></div>
              </div>
            </article>

            <article className="eg-card eg-small-panel">
              <h3>วันนี้</h3>
              <div className="eg-today">
                <div className="eg-today-row"><span>Calendar</span><b className="eg-unavailable">UNAVAILABLE</b></div>
                <div className="eg-today-row"><span>Gmail</span><b className="eg-unavailable">UNAVAILABLE</b></div>
                <div className="eg-today-row"><span>AI Tasks</span><b>{visibleActions.length} งาน</b></div>
                <div className="eg-today-row"><span>Experiments</span><b className="eg-unavailable">UNAVAILABLE</b></div>
              </div>
            </article>
          </section>
        </div>

        <div className="eg-mobile">
          <header className="eg-mobile-top">
            <div className="eg-mobile-brand"><span className="eg-brand-mark" aria-hidden="true" /><span>CEO AI</span></div>
            <button className="eg-mobile-menu" type="button" aria-label="เปิดเมนู">≡</button>
          </header>

          <div className="eg-mobile-body">
            <div className="eg-mobile-title">
              <h1>ภาพรวมธุรกิจ</h1>
              <p>สวัสดีครับ · {workspaceName}</p>
            </div>

            <section className="eg-mobile-health">
              <div className="eg-mobile-health-top"><small>Business Health</small><span className="eg-change">UNAVAILABLE</span></div>
              <div className="eg-health-score">— <span>/ 100</span></div>
              <div className="eg-mini-bar"><i /></div>
            </section>

            <section className="eg-mobile-kpis">
              <article className="eg-card eg-mobile-kpi"><small>Leads</small><strong>—</strong><small>เดือนนี้</small></article>
              <article className="eg-card eg-mobile-kpi"><small>MRR</small><strong>—</strong><small>เดือนนี้</small></article>
            </section>

            <section className="eg-card eg-mobile-section">
              <h2>3 เรื่องที่ควรทำต่อ</h2>
              <ol className="eg-mobile-action-list">
                {visibleActions.map((action, index) => (
                  <li key={action.id}>
                    <span className="eg-action-index">{index + 1}</span>
                    <div><strong>{action.title}</strong><small>{action.description || 'Human approval required'}</small></div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="eg-card eg-mobile-trend">
              <div className="eg-mobile-trend-head"><h2>Growth Trend</h2><span>UNAVAILABLE</span></div>
              <div className="eg-mobile-trend-box">ยังไม่มีข้อมูล Trend ที่ยืนยันแล้ว</div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
