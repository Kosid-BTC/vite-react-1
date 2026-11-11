import { useEffect, useMemo, useState } from 'react';
import {
  diagnoseMarketingHealth,
  getMarketingMeasurementHealth,
  type MarketingMeasurementHealth,
} from '../lib/marketingMeasurement';

interface Props {
  workspaceId: string | null;
  onAction?: (readyForExperiment: boolean) => void;
}

const toneColor = {
  good: 'var(--green)',
  warn: 'var(--amber)',
  critical: '#ef4444',
} as const;

function pct(value: number) {
  return `${Math.round(value)}%`;
}

export default function MarketingHealthPanel({ workspaceId, onAction }: Props) {
  const [health, setHealth] = useState<MarketingMeasurementHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!workspaceId) {
      setHealth(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    getMarketingMeasurementHealth(workspaceId)
      .then(result => {
        if (!cancelled) setHealth(result);
      })
      .catch(() => {
        if (!cancelled) setError('อ่าน Measurement Health ไม่สำเร็จ');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [workspaceId]);

  const diagnosis = useMemo(() => health ? diagnoseMarketingHealth(health) : null, [health]);

  if (!workspaceId) {
    return (
      <section className="an-card" style={{ marginBottom: 24, padding: 20 }}>
        <div className="an-card-label">Marketing Measurement</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6, color: 'var(--ink)' }}>เลือก Workspace เพื่อดูผลการตลาดจริง</div>
        <div className="an-card-sub" style={{ marginTop: 6 }}>โหมดทดลองในเครื่องจะไม่สร้างข้อสรุป Marketing Intelligence เพื่อป้องกันการอ่านข้อมูลผิด</div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="an-card" style={{ marginBottom: 24, padding: 20 }}>
        <div className="an-card-label">Marketing Measurement</div>
        <div style={{ marginTop: 10, color: 'var(--ink3)', fontSize: 13 }}>กำลังตรวจสุขภาพระบบวัดผล…</div>
      </section>
    );
  }

  if (error || !health || !diagnosis) {
    return (
      <section className="an-card" style={{ marginBottom: 24, padding: 20, borderColor: '#ef444455' }}>
        <div className="an-card-label">Marketing Measurement</div>
        <div style={{ marginTop: 8, color: '#ef4444', fontWeight: 700 }}>{error ?? 'ยังไม่มี Measurement configuration สำหรับ Workspace นี้'}</div>
        <div className="an-card-sub" style={{ marginTop: 6 }}>ระบบจะไม่เดาตัวเลขหรือสร้าง Recommendation จนกว่าจะอ่านข้อมูลจริงได้</div>
      </section>
    );
  }

  const color = toneColor[diagnosis.tone];
  const sampleProgress = Math.min(100, Math.round((health.event_count / Math.max(1, health.min_rate_sample)) * 100));
  const readyForExperiment = health.reliability === 'reliable' && health.rate_metrics_mature;

  return (
    <section className="an-card" style={{ marginBottom: 24, padding: 22, borderColor: `${color}55` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 220, flex: '1 1 420px' }}>
          <div className="an-card-label">Marketing Health · Insight First</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color }}>{health.score}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>/ 100 · {health.reliability}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginTop: 8 }}>{diagnosis.title}</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink2)', marginTop: 6 }}>{diagnosis.detail}</div>
          <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 10, background: `${color}10`, border: `1px solid ${color}30` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '.06em' }}>Next Best Action</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink)', marginTop: 4 }}>{diagnosis.action}</div>
          </div>
          {onAction && (
            <button
              type="button"
              onClick={() => onAction(readyForExperiment)}
              style={{ marginTop: 14, border: 0, borderRadius: 10, padding: '10px 16px', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', background: color, color: '#fff' }}
            >
              {readyForExperiment ? 'สร้าง Experiment →' : 'ไปแก้ระบบการตลาด →'}
            </button>
          )}
        </div>

        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(110px, 1fr))', gap: 10 }}>
            {[
              ['UTM Coverage', pct(health.utm_coverage)],
              ['Campaign ID', pct(health.campaign_id_coverage)],
              ['Content ID', pct(health.content_id_coverage)],
              ['Attribution', pct(health.attribution_coverage)],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: 12, borderRadius: 10, background: 'var(--cream3)', border: '1px solid var(--sand)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginTop: 3 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5, color: 'var(--ink3)', marginBottom: 6 }}>
              <span>Data maturity</span>
              <span>{health.event_count.toLocaleString('th-TH')} / {health.min_rate_sample.toLocaleString('th-TH')} events</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'var(--cream3)', overflow: 'hidden', border: '1px solid var(--sand)' }}>
              <div style={{ height: '100%', width: `${sampleProgress}%`, background: color, transition: 'width .25s ease' }} />
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink4)', marginTop: 7 }}>
              {health.rate_metrics_mature
                ? 'ผ่านเกณฑ์ sample แล้ว — ใช้อัตราได้เมื่อ Tracking Health เพียงพอ'
                : 'ยังดู “จำนวนจริง” ก่อน ไม่สรุป Conversion Rate / CPA / ROAS'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
