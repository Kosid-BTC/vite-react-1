import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// เรียก Edge Function `os-marketing-brain` (รีโป Kosid-B/vite-react) ในนามผู้ใช้ที่ล็อกอิน
// ฟังก์ชันตรวจการเป็นสมาชิก workspace เอง + อ่านตัวเลข funnel เองฝั่ง server · คืน "ร่าง" เท่านั้น

export type AnalyzeResult = {
  summary: string;
  data_quality: { enough_sample: boolean; note: string };
  insights: { observation: string; interpretation: string; evidence_level: 'fact' | 'estimate' | 'opinion'; confidence: 'low' | 'medium' | 'high' }[];
  recommended_segment_code: string;
  recommended_pillar_code: string;
  next_experiment: { hypothesis: string; expected_signal: string; decision_rule: string };
};

export type ImageBrief = { concept: string; composition: string; on_image_text: string; style: string; avoid: string };
export type AdVariant = {
  angle: string;
  story_model: string;
  writing_style: string;
  hooks: string[];
  recommended_hook: string;
  body: string;
  caption: string;
  cta: string;
  funnel_stage: 'awareness' | 'consideration' | 'intent' | 'conversion';
  image_brief: ImageBrief;
};
export type AdsResult = {
  strategy: { objective: string; audience: string; pain_point: string; reason: string };
  variants: AdVariant[];
  measurement: string[];
};
export type ComplianceResult = {
  results: { variant_index: number; findings: { brand_rule_id: string | null; severity: 'info' | 'warning' | 'blocking'; finding: string; suggested_fix: string }[] }[];
};

type BrainResponse<T> = { task: string; model: string; result: T; usage: { input: number; output: number } };

/** ข้อความที่คนอ่านเข้าใจ — แยก "ปัญหาที่แก้ได้เอง" ออกจาก "ระบบยังไม่พร้อม" */
const ERROR_TEXT: Record<string, string> = {
  not_a_member: 'บัญชีนี้ไม่ใช่สมาชิกของ workspace นี้',
  refused: 'AI ปฏิเสธคำขอนี้ — ลองปรับข้อมูลกลุ่มหรือสารหลัก',
  rate_limited: 'AI ถูกเรียกถี่เกินไป — รอสักครู่แล้วลองใหม่',
  output_truncated: 'ผลลัพธ์ยาวเกินกำหนด — ลองใหม่อีกครั้ง',
  missing_api_key: 'ระบบหลังบ้านยังไม่ได้ตั้งคีย์ AI',
  not_deployed: 'ระบบ AI ยังไม่ได้เปิดใช้งาน (ยังไม่ได้ deploy ฟังก์ชัน os-marketing-brain)',
};

export class BrainError extends Error {
  constructor(public code: string) {
    super(ERROR_TEXT[code] ?? `ระบบ AI ขัดข้อง (${code})`);
  }
}

export async function callBrain<T>(db: SupabaseClient<Database, 'marketing_os'>, body: Record<string, unknown>) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) throw new BrainError('not_logged_in');
  const { data, error } = await db.functions.invoke<BrainResponse<T>>('os-marketing-brain', {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) {
    // FunctionsHttpError มี response ของฟังก์ชันติดมา — อ่าน code ที่ฟังก์ชันส่งกลับ
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      if (ctx.status === 404) throw new BrainError('not_deployed');
      const payload = await ctx.json().catch(() => null) as { error?: string } | null;
      throw new BrainError(payload?.error ?? `http_${ctx.status}`);
    }
    throw new BrainError('unreachable');
  }
  if (!data) throw new BrainError('empty_output');
  return data;
}
