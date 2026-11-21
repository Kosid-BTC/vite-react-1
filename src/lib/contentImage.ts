/** Content Factory: Text→Image (Phase D) — prompt ต้องผ่าน brand guardrail ก่อนเรียกผู้ให้บริการ
 *  ปิดเป็นค่าเริ่มต้น (INTEGRATIONS.imageGenLive) · ภาพที่ได้เป็น "ร่าง" ต้องให้คนตรวจก่อนใช้ ไม่เข้าคลังเองอัตโนมัติ */
import { INTEGRATIONS } from '../config';
import { isSupabaseEnabled } from './supabase';
import { checkGuardrails } from './contentLibrary';
import { invokeFn } from './invokeWithTimeout';

export type ImageAspect = '1:1' | '16:9' | '9:16';

/** ประกอบ prompt จากหัวข้อ/เนื้อหา — ไม่ใส่ข้อความ/ราคาลงในภาพ (โมเดลภาพเขียนตัวอักษรไทยผิดบ่อย) */
export function buildImagePrompt(title: string, body: string): string {
  const topic = `${title.trim()}. ${body.trim()}`.replace(/\s+/g, ' ').slice(0, 600);
  return `Clean modern marketing illustration for a Thai SME business audience. Topic: ${topic}. Professional, optimistic, flat design, no text, no logos, no numbers, no people's faces.`;
}

export type ImageResult = { ok: true; dataUrl: string } | { ok: false; reason: string };

export async function generateImage(title: string, body: string, aspect: ImageAspect = '1:1'): Promise<ImageResult> {
  if (!INTEGRATIONS.imageGenLive) return { ok: false, reason: 'ยังไม่เปิดใช้งานการสร้างภาพ (รอตั้งค่าผู้ให้บริการ)' };
  const issues = checkGuardrails({ title, body });
  if (issues.length) return { ok: false, reason: issues.map(i => i.message).join(' · ') };
  if (!isSupabaseEnabled) return { ok: false, reason: 'ต้องเข้าสู่ระบบก่อน' };
  const res = await invokeFn<{ ok?: boolean; mime?: string; base64?: string; error?: string }>(
    'content-image', { body: { prompt: buildImagePrompt(title, body), aspect } }, 60_000);
  const d = res?.data;
  if (!d?.ok || !d.base64) return { ok: false, reason: d?.error === 'image_provider_not_configured' ? 'ผู้ให้บริการภาพยังไม่ตั้งค่า' : 'สร้างภาพไม่สำเร็จ ลองใหม่อีกครั้ง' };
  return { ok: true, dataUrl: `data:${d.mime ?? 'image/jpeg'};base64,${d.base64}` };
}
