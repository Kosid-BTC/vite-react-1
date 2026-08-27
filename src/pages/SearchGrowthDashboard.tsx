import { useMemo } from 'react';
import type { AppData, PageId } from '../types';
import {
  CEO_AI_ENTITY,
  SEARCH_OWNERSHIP_CYCLE,
  calculateEci,
  diagnoseSearchHealth,
  proposeSearchNba,
  type EvidenceReliability,
} from '../lib/searchOwnership';
import './SearchGrowthDashboard.css';

interface Props {
  data: AppData;
  onNavigate: (page: PageId) => void;
  wsId?: string | null;
}

type MetricCardProps = {
  eyebrow: string;
  value: string;
  hint: string;
  tone: 'violet' | 'blue' | 'green' | 'amber' | 'pink' | 'slate';
};

const TONE_ICONS: Record<MetricCardProps['tone'], string> = {
  violet: '◉',
  blue: '◎',
  green: '▶',
  amber: '↗',
  pink: '✦',
  slate: '◇',
};

function MetricCard({ eyebrow, value, hint, tone }: MetricCardProps) {
  return (
    <article className={`sgd-metric sgd-tone-${tone}`}>
      <div className="sgd-metric__top">
        <span className="sgd-metric__icon" aria-hidden="true">{TONE_ICONS[tone]}</span>
        <span>{eyebrow}</span>
      </div>
      <strong>{value}</strong>
      <span className="sgd-metric__hint">{hint}</span>
      <span className="sgd-spark" aria-hidden="true" />
    </article>
  );
}

const CYCLE_LABELS: Record<(typeof SEARCH_OWNERSHIP_CYCLE)[number], { short: string; detail: string }> = {
  OBSERVED: { short: 'Observe', detail: 'Google Brand Confusion' },
  OPPORTUNITY_CLASSIFIED: { short: 'Opportunity', detail: 'วิกฤติ → โอกาส' },
  RISK_ASSESSED: { short: 'Risk / Opportunity', detail: 'ประเมินความเสี่ยง' },
  ENTITY_CONTROLLED: { short: 'Canonical Entity', detail: 'ควบคุม Entity หลัก' },
  OWNERSHIP_MEASURED: { short: 'Search Ownership', detail: 'วัดการครองพื้นที่ค้นหา' },
  ECI_EVALUATED: { short: 'ECI', detail: 'วัดความสับสน Entity' },
  DIAGNOSED: { short: 'Diagnosis', detail: 'วิเคราะห์สาเหตุ' },
  NBA_PROPOSED: { short: 'NBA', detail: 'ข้อเสนอ Next Best Action' },
  APPROVED: { short: 'Approve', detail: 'Human Decision' },
  ACTIONED: { short: 'Action', detail: 'ดำเนินการควบคุม' },
  MEASURED: { short: 'Measure', detail: 'วัดผลจริง' },
  LEARNED: { short: 'Learning', detail: 'เรียนรู้จาก Evidence' },
  CLOSED: { short: 'Next Cycle', detail: 'เริ่มรอบใหม่' },
};

function EmptySearchChart() {
  return (
    <div className="sgd-chart-empty" role="status">
      <div className="sgd-chart-empty__line" />
      <strong>ยังไม่มี Search Evidence ที่เชื่อถือได้</strong>
      <span>เชื่อม Google Search Console / SERP Evidence เพื่อเริ่มสร้าง Trend จริง</span>
    </div>
  );
}

export default function SearchGrowthDashboard({ data, onNavigate, wsId }: Props) {
  const conversionCount = data.funnel?.[data.funnel.length - 1]?.leads ?? 0;
  const activeActions = data.actions?.filter((action) => !action.done).length ?? 0;
  const completedActions = data.actions?.filter((action) => action.done).length ?? 0;

  // Deliberately incomplete until trusted GSC/SERP inputs are connected.
  const eci = useMemo(() => calculateEci({
    brandConsistency: undefined,
    structuredEntityConsistency: undefined,
    ownedSerpCoverage: undefined,
    brandedQueryDominance: undefined,
    associationAccuracy: undefined,
  }), []);

  const reliability: EvidenceReliability = 'INSUFFICIENT_DATA';
  const diagnosis = diagnoseSearchHealth({ eci, reliability });
  const nba = proposeSearchNba(diagnosis);
  const workspaceLabel = wsId ? `Workspace ${wsId.slice(0, 8)}` : 'Local workspace';

  return (
    <div className="sgd-shell">
      <header className="sgd-header">
        <div>
          <span className="sgd-kicker">{CEO_AI_ENTITY.canonicalName}</span>
          <h1>Search & Entity Intelligence</h1>
          <p>Growth OS สำหรับ Search Ownership, Entity Health, Content Factory และ Continuous Improvement</p>
        </div>
        <div className="sgd-header__actions">
          <span className="sgd-pill">{workspaceLabel}</span>
          <span className="sgd-pill sgd-pill--warning">Evidence: ยังไม่พอ</span>
          <button className="sgd-btn sgd-btn--primary" onClick={() => onNavigate('actions')}>✦ สร้าง Action Plan</button>
        </div>
      </header>

      <section className="sgd-metrics" aria-label="Marketing summary">
        <MetricCard eyebrow="Impressions (Organic)" value="—" hint="รอ GSC" tone="violet" />
        <MetricCard eyebrow="Reach" value="—" hint="รอ Channel sync" tone="blue" />
        <MetricCard eyebrow="Video Views" value="—" hint="รอ Social sync" tone="green" />
        <MetricCard eyebrow="CTR (Search)" value="—" hint="รอ GSC" tone="amber" />
        <MetricCard eyebrow="Conversions" value={conversionCount.toLocaleString('th-TH')} hint="จาก Funnel ปัจจุบัน" tone="pink" />
        <MetricCard eyebrow="Open Actions" value={String(activeActions)} hint={`${completedActions} งานเสร็จแล้ว`} tone="slate" />
      </section>

      <section className="sgd-grid sgd-grid--hero">
        <article className="sgd-card sgd-health-card">
          <div className="sgd-card__head">
            <div>
              <span className="sgd-card__eyebrow">SEARCH & ENTITY HEALTH</span>
              <h2>ภาพรวมความชัดเจนของแบรนด์</h2>
            </div>
            <span className="sgd-status sgd-status--warning">INSUFFICIENT DATA</span>
          </div>
          <div className="sgd-health-grid">
            <div className="sgd-ring sgd-ring--empty">
              <div><strong>—</strong><span>Entity Health</span></div>
            </div>
            <div className="sgd-health-stat">
              <span>Entity Confusion Index (ECI)</span>
              <strong>{eci.status === 'OK' ? eci.eci.toFixed(0) : '—'}</strong>
              <small>ยิ่งต่ำยิ่งดี · eci.v1</small>
            </div>
            <div className="sgd-health-stat">
              <span>Search Ownership</span>
              <strong>—</strong>
              <small>ต้องมี SERP Evidence</small>
            </div>
            <div className="sgd-health-stat">
              <span>Owned SERP Coverage</span>
              <strong>—</strong>
              <small>ยังไม่วัดผล</small>
            </div>
          </div>
        </article>

        <article className="sgd-card sgd-rings-card">
          <div className="sgd-card__head">
            <div>
              <span className="sgd-card__eyebrow">SEARCH OWNERSHIP MODEL</span>
              <h2>4 Search Rings</h2>
            </div>
          </div>
          <div className="sgd-rings-layout">
            <div className="sgd-donut" aria-label="Four strategic search rings"><span>4<br/><small>Rings</small></span></div>
            <ul className="sgd-ring-list">
              <li><i className="ring-brand" /> <span><b>Ring 1</b> Brand</span><em>Own Brand</em></li>
              <li><i className="ring-category" /> <span><b>Ring 2</b> Category</span><em>Own Category</em></li>
              <li><i className="ring-problem" /> <span><b>Ring 3</b> Problem</span><em>Qualified Demand</em></li>
              <li><i className="ring-adjacent" /> <span><b>Ring 4</b> Adjacent</span><em>Semantic Bridge</em></li>
            </ul>
          </div>
        </article>

        <aside className="sgd-card sgd-issue-card">
          <span className="sgd-card__eyebrow">TOP ISSUE</span>
          <h2>ยังสรุป Entity Confusion ไม่ได้</h2>
          <p>ระบบจะไม่สร้างคะแนนหรือข้อสรุปจากข้อมูลสมมติ ต้องมี Search Evidence ที่ตรวจสอบได้ก่อน</p>
          <div className="sgd-divider" />
          <span className="sgd-card__eyebrow">NEXT BEST ACTION</span>
          <h3>{nba.title}</h3>
          <p>{nba.expectedLearning}</p>
          <button className="sgd-btn sgd-btn--primary sgd-btn--block" onClick={() => onNavigate('actions')}>สร้าง Action Plan</button>
        </aside>
      </section>

      <section className="sgd-grid sgd-grid--analytics">
        <article className="sgd-card">
          <div className="sgd-card__head">
            <div>
              <span className="sgd-card__eyebrow">ECI TREND</span>
              <h2>Entity Confusion Index</h2>
            </div>
            <span className="sgd-status">28 วัน</span>
          </div>
          <EmptySearchChart />
        </article>

        <article className="sgd-card">
          <div className="sgd-card__head">
            <div>
              <span className="sgd-card__eyebrow">BRANDED QUERY PERFORMANCE</span>
              <h2>คำค้นแบรนด์</h2>
            </div>
          </div>
          <div className="sgd-table-wrap">
            <table className="sgd-table">
              <thead><tr><th>Query</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
              <tbody>
                {['CEO AI Thailand', 'ceoaithailand', 'CEOAIThailand'].map((q) => (
                  <tr key={q}><td>{q}</td><td>—</td><td>—</td><td>—</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sgd-inline-note">เชื่อม GSC แล้วระบบจะจัดกลุ่ม BRAND / CATEGORY / PROBLEM / ADJACENT อัตโนมัติ</div>
        </article>

        <article className="sgd-card">
          <div className="sgd-card__head">
            <div>
              <span className="sgd-card__eyebrow">MEASUREMENT HEALTH</span>
              <h2>ความน่าเชื่อถือของข้อมูล</h2>
            </div>
          </div>
          <div className="sgd-measurement">
            <div className="sgd-mini-ring"><strong>0</strong><span>/100</span></div>
            <ul>
              <li><span>GSC Connected</span><b>ยังไม่เชื่อม</b></li>
              <li><span>SERP Evidence</span><b>ยังไม่มี</b></li>
              <li><span>Entity Audit</span><b>พร้อมเริ่ม</b></li>
              <li><span>Trusted Ingestion</span><b>ต้องเชื่อม backend</b></li>
            </ul>
          </div>
        </article>
      </section>

      <section className="sgd-grid sgd-grid--operations">
        <article className="sgd-card">
          <div className="sgd-card__head">
            <div><span className="sgd-card__eyebrow">CONTENT FACTORY</span><h2>สร้าง Creative จาก Evidence</h2></div>
          </div>
          <div className="sgd-factory-grid">
            <button onClick={() => onNavigate('content')}><span>▧</span><b>Text → Image</b><small>สร้างภาพจากเนื้อหา</small></button>
            <button onClick={() => onNavigate('content')}><span>▶</span><b>Text → Video</b><small>สร้างวิดีโอจากข้อความ</small></button>
            <button onClick={() => onNavigate('content')}><span>◈</span><b>Image → Video</b><small>ทำภาพให้เคลื่อนไหว</small></button>
          </div>
        </article>

        <article className="sgd-card">
          <div className="sgd-card__head">
            <div><span className="sgd-card__eyebrow">AI INSIGHT</span><h2>Insight First</h2></div>
          </div>
          <div className="sgd-ai-insight">
            <span className="sgd-ai-badge">AI</span>
            <div>
              <strong>ยังไม่ควร Optimize จาก Search</strong>
              <p>หลักฐาน Search ยังไม่เพียงพอ ขั้นถัดไปคือเชื่อม trusted evidence ก่อนให้ Growth Core สร้าง Diagnosis เชิงกลยุทธ์</p>
            </div>
          </div>
        </article>

        <article className="sgd-card">
          <div className="sgd-card__head">
            <div><span className="sgd-card__eyebrow">NEXT BEST ACTIONS</span><h2>งานที่ควรทำต่อ</h2></div>
          </div>
          <div className="sgd-actions-list">
            <button onClick={() => onNavigate('marketing')}><span>1</span><div><b>ตรวจ Canonical Entity</b><small>รวม Organization / WebSite / llms.txt ให้ใช้ Source of Truth เดียว</small></div><em>→</em></button>
            <button onClick={() => onNavigate('actions')}><span>2</span><div><b>เชื่อม Search Evidence</b><small>เตรียม GSC/SERP trusted ingestion</small></div><em>→</em></button>
            <button onClick={() => onNavigate('content')}><span>3</span><div><b>สร้าง Content จาก Evidence</b><small>เริ่มเมื่อ Search Intent และ Gap ผ่าน Gate</small></div><em>→</em></button>
          </div>
        </article>
      </section>

      <section className="sgd-card sgd-cycle-card">
        <div className="sgd-card__head">
          <div>
            <span className="sgd-card__eyebrow">CONTINUOUS IMPROVEMENT</span>
            <h2>Search Ownership Improvement Cycle</h2>
          </div>
          <span className="sgd-status sgd-status--active">Cycle foundation ready</span>
        </div>
        <div className="sgd-cycle-scroll">
          <ol className="sgd-cycle">
            {SEARCH_OWNERSHIP_CYCLE.map((state, index) => {
              const meta = CYCLE_LABELS[state];
              const complete = index < 5;
              return (
                <li key={state} className={complete ? 'is-complete' : index === 5 ? 'is-current' : ''}>
                  <span className="sgd-cycle__node">{complete ? '✓' : index + 1}</span>
                  <b>{meta.short}</b>
                  <small>{meta.detail}</small>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
