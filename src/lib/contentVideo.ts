/** Content Factory: Text→Video (Phase VDO) — async job (start → poll) ผ่าน Edge Function content-video (fal.ai)
 *  ปิดเป็นค่าเริ่มต้น (INTEGRATIONS.videoGenLive) · สร้างได้เฉพาะเนื้อหาที่ "อนุมัติแล้ว" (คุมต้นทุน + ผ่าน guardrail)
 *  โควตา/วัน บังคับที่ server (VIDEO_DAILY_LIMIT) · วิดีโอเป็นร่างให้คนตรวจก่อนเผยแพร่ */
import { INTEGRATIONS } from '../config';
import { isSupabaseEnabled } from './supabase';
import { checkGuardrails, type ContentItem } from './contentLibrary';
import { invokeFn } from './invokeWithTimeout';

export const POLL_INTERVAL_MS = 5000;
export const POLL_MAX_MS = 5 * 60_000;

/** prompt วิดีโอสั้น — ไม่ใส่ตัวอักษร/ราคา/ใบหน้าคนในภาพ (โมเดลเขียนไทยผิดบ่อย) */
export function buildVideoPrompt(title: string, body: string): string {
  const topic = `${title.trim()}. ${body.trim()}`.replace(/\s+/g, ' ').slice(0, 500);
  return `Short smooth cinematic motion graphic for a Thai SME marketing clip. Topic: ${topic}. Clean modern style, gentle camera movement, no text, no logos, no numbers, no recognizable faces.`;
}

export type VideoStart = { ok: true; statusUrl: string; responseUrl: string; remaining: number } | { ok: false; reason: string };
export type VideoPoll = { ok: true; status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'; videoUrl?: string } | { ok: false; reason: string };

const REASONS: Record<string, string> = {
  daily_limit_reached: 'ครบโควตาวิดีโอของวันนี้แล้ว ลองใหม่พรุ่งนี้',
  video_provider_not_configured: 'ผู้ให้บริการวิดีโอยังไม่ตั้งค่า',
  quota_unavailable: 'ตรวจโควตาไม่ได้ในขณะนี้ ลองใหม่อีกครั้ง',
};

export async function startVideo(item: Pick<ContentItem, 'title' | 'body' | 'status'>): Promise<VideoStart> {
  if (!INTEGRATIONS.videoGenLive) return { ok: false, reason: 'ยังไม่เปิดใช้งานการสร้างวิดีโอ (รอตั้งค่าผู้ให้บริการ)' };
  if (item.status !== 'approved') return { ok: false, reason: 'สร้างวิดีโอได้เฉพาะเนื้อหาที่อนุมัติแล้ว' };
  const issues = checkGuardrails(item);
  if (issues.length) return { ok: false, reason: issues.map(i => i.message).join(' · ') };
  if (!isSupabaseEnabled) return { ok: false, reason: 'ต้องเข้าสู่ระบบก่อน' };
  const res = await invokeFn<{ ok?: boolean; statusUrl?: string; responseUrl?: string; remaining?: number; error?: string }>(
    'content-video', { body: { action: 'start', prompt: buildVideoPrompt(item.title, item.body) } }, 30_000);
  const d = res?.data;
  if (!d?.ok || !d.statusUrl || !d.responseUrl) return { ok: false, reason: REASONS[d?.error ?? ''] ?? 'เริ่มสร้างวิดีโอไม่สำเร็จ ลองใหม่อีกครั้ง' };
  return { ok: true, statusUrl: d.statusUrl, responseUrl: d.responseUrl, remaining: d.remaining ?? 0 };
}

export async function pollVideo(statusUrl: string, responseUrl: string): Promise<VideoPoll> {
  const res = await invokeFn<{ ok?: boolean; status?: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'; videoUrl?: string; error?: string }>(
    'content-video', { body: { action: 'poll', statusUrl, responseUrl } }, 30_000);
  const d = res?.data;
  if (!d?.ok || !d.status) return { ok: false, reason: 'ตรวจสถานะวิดีโอไม่สำเร็จ' };
  return { ok: true, status: d.status, videoUrl: d.videoUrl };
}
