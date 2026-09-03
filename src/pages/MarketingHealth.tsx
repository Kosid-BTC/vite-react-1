import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  diagnoseMarketingHealth,
  listMarketingMeasurementHealth,
  type MarketingMeasurementHealth,
} from '../lib/marketingMeasurement';

interface WorkspaceName {
  id: string;
  name: string;
}

const C = {
  bg: '#020617',
  panel: '#0f172a',
  panel2: '#111827',
  border: '#1e293b',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
};

function toneColor(tone: 'good' | 'warn' | 'critical') {
  return tone === 'good' ? C.green : tone === 'warn' ? C.amber : C.red;
}

function metricCard(label: string, value: string) {
  return (
    <div style={{ border: `1px solid ${C.border}`, background: C.panel2, borderRadius: 14, padding: 16 }}>
      <div style={{ color: C.muted, fontSize: 12 }}>{label}</div>
      <div style={{ color: C.text, fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function MarketingHealth() {
  const [rows, setRows] = useState<MarketingMeasurementHealth[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceName[]>([]);
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState<'loading' | 'signed_out' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabase) {
        if (!cancelled) setStatus('error');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (!cancelled) setStatus('signed_out');
        return;
      }

      const [health, workspaceResult] = await Promise.all([
        listMarketingMeasurementHealth(),
        supabase.from('workspaces').select('id,name').order('created_at', { ascending: true }),
      ]);

      if (workspaceResult.error) throw workspaceResult.error;
      const workspaceRows = (workspaceResult.data ?? []).map(row => ({
        id: String(row.id),
        name: String(row.name),
      }));

      if (!cancelled) {
        setRows(health);
        setWorkspaces(workspaceRows);
        const requested = new URL(window.location.href).searchParams.get('workspace');
        const first = requested && health.some(row => row.workspace_id === requested)
          ? requested
          : health[0]?.workspace_id ?? '';
        setSelected(first);
        setStatus('ready');
      }
    }

    load().catch(() => {
      if (!cancelled) setStatus('error');
    });

    return () => { cancelled = true; };
  }, []);

  const health = useMemo(
    () => rows.find(row => row.workspace_id === selected) ?? null,
    [rows, selected],
  );
  const diagnosis = useMemo(() => health ? diagnoseMarketingHealth(health) : null, [health]);
  const workspaceName = workspaces.find(item => item.id === selected)?.name ?? 'Workspace';

  if (status === 'loading') {
    return <Shell><Card title="Marketing Health">กำลังอ่านข้อมูลจริงจาก Supabase…</Card></Shell>;
  }

  if (status === 'signed_out') {
    return (
      <Shell>
        <Card title="Marketing Health">
          <p style={{ color: C.muted, margin: '0 0 16px' }}>หน้านี้อ่านข้อมูลตาม RLS ของ Workspace จึงต้องเข้าสู่ระบบก่อน</p>
          <a href="/" style={primaryLinkStyle}>กลับไปเข้าสู่ระบบ</a>
        </Card>
      </Shell>
    );
  }

  if (status === 'error') {
    return <Shell><Card title="Marketing Health"><span style={{ color: C.red }}>อ่านระบบวัดผลไม่สำเร็จ ระบบจะไม่เดาตัวเลขแทนข้อมูลจริง</span></Card></Shell>;
  }

  if (!health || !diagnosis) {
    return (
      <Shell>
        <Card title="Marketing Health">
          <p style={{ color: C.muted, margin: 0 }}>ยังไม่มี Measurement Configuration สำหรับ Workspace ที่บัญชีนี้เข้าถึงได้</p>
        </Card>
      </Shell>
    );
  }

  const color = toneColor(diagnosis.tone);
  const sampleProgress = Math.min(100, Math.round((health.event_count / Math.max(1, health.min_rate_sample)) * 100));

  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <div style={{ color: C.cyan, fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>CEO AI Marketing OS</div>
          <h1 style={{ color: C.text, fontSize: 30, margin: '6px 0 4px' }}>Marketing Health</h1>
          <p style={{ color: C.muted, margin: 0 }}>Insight ก่อนกราฟ · ตรวจคุณภาพข้อมูลก่อนให้ AI แนะนำการตลาด</p>
        </div>
        <a href="/" style={secondaryLinkStyle}>← กลับระบบหลัก</a>
      </div>

      {workspaces.length > 1 && (
        <div style={{ marginBottom: 18 }}>
          <label htmlFor="workspace" style={{ color: C.muted, fontSize: 12, display: 'block', marginBottom: 6 }}>Workspace</label>
          <select
            id="workspace"
            value={selected}
            onChange={event => setSelected(event.target.value)}
            style={{ width: 'min(100%, 420px)', borderRadius: 10, border: `1px solid ${C.border}`, background: C.panel, color: C.text, padding: '10px 12px', fontFamily: 'inherit' }}
          >
            {rows.map(row => (
              <option key={row.workspace_id} value={row.workspace_id}>
                {workspaces.find(item => item.id === row.workspace_id)?.name ?? row.workspace_id}
              </option>
            ))}
          </select>
        </div>
      )}

      <section style={{ border: `1px solid ${color}55`, background: C.panel, borderRadius: 18, padding: 22, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(260px, .7fr)', gap: 22 }}>
          <div>
            <div style={{ color: C.muted, fontSize: 12 }}>{workspaceName}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 5 }}>
              <span style={{ color, fontSize: 46, fontWeight: 900 }}>{health.score}</span>
              <span style={{ color, fontWeight: 700 }}>/ 100 · {health.reliability}</span>
            </div>
            <h2 style={{ color: C.text, fontSize: 21, margin: '12px 0 6px' }}>{diagnosis.title}</h2>
            <p style={{ color: C.muted, lineHeight: 1.7, margin: 0 }}>{diagnosis.detail}</p>

            <div style={{ marginTop: 16, border: `1px solid ${color}35`, background: `${color}10`, borderRadius: 12, padding: 14 }}>
              <div style={{ color, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>Next Best Action</div>
              <div style={{ color: C.text, marginTop: 5 }}>{diagnosis.action}</div>
            </div>
          </div>

          <div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 7 }}>Data maturity</div>
            <div style={{ height: 10, borderRadius: 999, background: '#1e293b', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${sampleProgress}%`, background: color }} />
            </div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 7 }}>
              {health.event_count.toLocaleString('th-TH')} / {health.min_rate_sample.toLocaleString('th-TH')} events
            </div>
            <div style={{ color: health.rate_metrics_mature ? C.green : C.amber, fontSize: 12.5, lineHeight: 1.6, marginTop: 12 }}>
              {health.rate_metrics_mature
                ? 'ผ่าน sample gate แล้ว แต่ยังต้องดู Tracking Health ก่อนใช้ rate metrics'
                : 'ยังไม่สรุป Conversion Rate / CPA / ROAS — ดูจำนวนจริงก่อน'}
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
        {metricCard('UTM Coverage', `${Math.round(health.utm_coverage)}%`)}
        {metricCard('Campaign ID', `${Math.round(health.campaign_id_coverage)}%`)}
        {metricCard('Content ID', `${Math.round(health.content_id_coverage)}%`)}
        {metricCard('Attribution', `${Math.round(health.attribution_coverage)}%`)}
        {metricCard('Tracking Error', `${Math.round(health.tracking_error_rate)}%`)}
        {metricCard('Events · 28 วัน', health.event_count.toLocaleString('th-TH'))}
      </div>

      <Card title="หลักการตัดสินใจของระบบ">
        <div style={{ display: 'grid', gap: 10, color: C.muted, fontSize: 13.5, lineHeight: 1.65 }}>
          <div>1. Tracking ผิดหรือ UTM ไม่ครบ → ห้าม AI สรุปกลยุทธ์</div>
          <div>2. Sample ต่ำกว่าเกณฑ์ → แสดง Count ก่อน Rate</div>
          <div>3. เมื่อข้อมูลพร้อม → ทดลอง Hook / Thumbnail / CTA ทีละตัวแปร</div>
          <div>4. ผล Experiment ที่ชนะ → ส่งกลับไป Content Factory เพื่อสร้าง Variant รอบถัดไป</div>
        </div>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Kanit', system-ui, sans-serif", padding: '28px 18px 64px' }}>
      <div style={{ width: 'min(1080px, 100%)', margin: '0 auto' }}>{children}</div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: `1px solid ${C.border}`, background: C.panel, borderRadius: 16, padding: 20 }}>
      <div style={{ color: C.cyan, fontWeight: 800, marginBottom: 10 }}>{title}</div>
      {children}
    </section>
  );
}

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  background: C.cyan,
  color: '#00212b',
  textDecoration: 'none',
  fontWeight: 800,
  borderRadius: 10,
  padding: '10px 16px',
};

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  border: `1px solid ${C.border}`,
  color: C.text,
  textDecoration: 'none',
  fontWeight: 700,
  borderRadius: 10,
  padding: '9px 14px',
};
