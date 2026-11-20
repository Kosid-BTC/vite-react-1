import { supabase } from './supabase';

export interface MarketingMeasurementHealth {
  workspace_id: string;
  event_count: number;
  utm_coverage: number;
  campaign_id_coverage: number;
  content_id_coverage: number;
  attribution_coverage: number;
  tracking_error_rate: number;
  latest_event_at: string | null;
  score: number;
  reliability: 'reliable' | 'caution' | 'unreliable';
  rate_metrics_mature: boolean;
  min_rate_sample: number;
}

export interface MarketingHealthDiagnosis {
  title: string;
  detail: string;
  action: string;
  tone: 'good' | 'warn' | 'critical';
}

function normalizeHealth(data: Record<string, unknown>): MarketingMeasurementHealth {
  return {
    workspace_id: String(data.workspace_id ?? ''),
    event_count: Number(data.event_count ?? 0),
    utm_coverage: Number(data.utm_coverage ?? 0),
    campaign_id_coverage: Number(data.campaign_id_coverage ?? 0),
    content_id_coverage: Number(data.content_id_coverage ?? 0),
    attribution_coverage: Number(data.attribution_coverage ?? 0),
    tracking_error_rate: Number(data.tracking_error_rate ?? 0),
    latest_event_at: data.latest_event_at ? String(data.latest_event_at) : null,
    score: Number(data.score ?? 0),
    reliability: String(data.reliability ?? 'unreliable') as MarketingMeasurementHealth['reliability'],
    rate_metrics_mature: Boolean(data.rate_metrics_mature),
    min_rate_sample: Number(data.min_rate_sample ?? 100),
  };
}

export async function getMarketingMeasurementHealth(
  workspaceId: string,
): Promise<MarketingMeasurementHealth | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('marketing_measurement_health_live')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return normalizeHealth(data as Record<string, unknown>);
}

export async function listMarketingMeasurementHealth(): Promise<MarketingMeasurementHealth[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('marketing_measurement_health_live')
    .select('*')
    .order('score', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(row => normalizeHealth(row as Record<string, unknown>));
}

export function diagnoseMarketingHealth(
  health: MarketingMeasurementHealth,
): MarketingHealthDiagnosis {
  if (health.reliability === 'unreliable') {
    const weakest = [
      ['UTM', health.utm_coverage],
      ['Campaign ID', health.campaign_id_coverage],
      ['Content ID', health.content_id_coverage],
      ['Attribution', health.attribution_coverage],
    ].sort((a, b) => Number(a[1]) - Number(b[1]))[0];

    return {
      title: 'ระบบวัดผลยังไม่น่าเชื่อถือ',
      detail: `${weakest[0]} coverage ต่ำสุดที่ ${Number(weakest[1]).toFixed(0)}% — ยังไม่ควรให้ AI สรุปกลยุทธ์จาก Conversion/CPA/ROAS`,
      action: 'แก้ Tracking ให้ครบก่อนเพิ่มงบหรือเปลี่ยน Creative',
      tone: 'critical',
    };
  }

  if (!health.rate_metrics_mature) {
    return {
      title: 'Tracking ใช้ได้ แต่ข้อมูลยังน้อย',
      detail: `มี ${health.event_count.toLocaleString('th-TH')} events จากขั้นต่ำ ${health.min_rate_sample.toLocaleString('th-TH')} ที่กำหนดไว้`,
      action: 'ดูจำนวนคนและ Intent ก่อน ยังไม่สรุปอัตรา Conversion',
      tone: 'warn',
    };
  }

  if (health.reliability === 'caution') {
    return {
      title: 'ข้อมูลใช้ดูแนวโน้มได้ แต่ยังต้องระวัง',
      detail: `Measurement Health ${health.score}/100 — ตรวจ UTM และ attribution ที่ขาดก่อนตัดสินใจเชิงงบประมาณ`,
      action: 'ปรับ Tracking Health ให้ถึง 90+ ก่อนใช้ Recommendation อัตโนมัติเต็มรูปแบบ',
      tone: 'warn',
    };
  }

  return {
    title: 'ระบบวัดผลพร้อมสำหรับ Learning Loop',
    detail: `Measurement Health ${health.score}/100 และ sample ผ่านเกณฑ์แล้ว`,
    action: 'เริ่มเปรียบเทียบ Hook, Creative และ CTA แบบ Experiment ทีละตัวแปร',
    tone: 'good',
  };
}
