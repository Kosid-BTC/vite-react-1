/** Content Library + Approval (Phase C) — draft → review → approved → published
 *  ผ่านด่าน brand guardrail ก่อนอนุมัติ (ราคา Starter ต้องเป็น ฿790 · ห้ามคำสัญญาเกินจริง) · pure/tested */
import { CURRENT_STARTER_OFFER, LEGACY_STARTER_PRICES } from './marketingTruth';
import type { MarketingChannelType } from '../types';

export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'rejected';

export interface ContentItem {
  id: string;
  title: string;
  body: string;
  channel: MarketingChannelType;
  campaignId?: string;
  status: ContentStatus;
  createdAt: string;
  decidedAt?: string;
  decisionNote?: string;
}

export interface GuardrailIssue { code: 'legacy_price' | 'overclaim' | 'empty'; message: string }

const OVERCLAIM = [/รับประกัน(ผล|รายได้)/, /การันตี/, /รวยเร็ว/, /รายได้\s*\d+\s*เท่า/, /\bguarantee[d]?\b/i];

/** ตรวจ guardrail — คืนรายการปัญหา (ว่าง = ผ่าน) */
export function checkGuardrails(item: Pick<ContentItem, 'title' | 'body'>): GuardrailIssue[] {
  const text = `${item.title}\n${item.body}`;
  const issues: GuardrailIssue[] = [];
  if (!item.title.trim() || !item.body.trim()) issues.push({ code: 'empty', message: 'หัวข้อและเนื้อหาต้องไม่ว่าง' });
  for (const old of Object.keys(LEGACY_STARTER_PRICES)) {
    // ราคาเก่าในรูป ฿390 หรือ 390 บาท หรือ 390/เดือน (ไม่ชนเลขที่ยาวกว่า เช่น 3,900 / 1390)
    const re = new RegExp(`(?:฿\\s*${old}(?![\\d,]))|(?:(?<![\\d,])${old}\\s*(?:บาท|/\\s*เดือน))`);
    if (re.test(text)) {
      issues.push({ code: 'legacy_price', message: `พบราคาเก่า ฿${old} — ราคา Starter ปัจจุบัน ฿${CURRENT_STARTER_OFFER.priceThbMonth}/เดือน (Owner decision)` });
    }
  }
  if (OVERCLAIM.some(r => r.test(text))) issues.push({ code: 'overclaim', message: 'พบคำสัญญาเกินจริง (รับประกันผล/รายได้) — ปรับให้เป็นข้อเท็จจริงที่วัดได้' });
  return issues;
}

const FLOW: Record<ContentStatus, ContentStatus[]> = {
  draft: ['review'],
  review: ['approved', 'rejected', 'draft'],
  approved: ['published', 'draft'],
  published: [],
  rejected: ['draft'],
};

export type TransitionResult = { ok: true; item: ContentItem } | { ok: false; reason: string };

/** เปลี่ยนสถานะตาม flow · อนุมัติ/เผยแพร่ได้เมื่อผ่าน guardrail เท่านั้น */
export function transition(item: ContentItem, to: ContentStatus, note = '', now = new Date()): TransitionResult {
  if (!FLOW[item.status].includes(to)) return { ok: false, reason: `เปลี่ยน ${item.status} → ${to} ไม่ได้` };
  if (to === 'approved' || to === 'published') {
    const issues = checkGuardrails(item);
    if (issues.length) return { ok: false, reason: issues.map(i => i.message).join(' · ') };
  }
  const decided = to === 'approved' || to === 'rejected' || to === 'published';
  return { ok: true, item: { ...item, status: to, decisionNote: note || item.decisionNote, decidedAt: decided ? now.toISOString() : item.decidedAt } };
}

export function newContentItem(p: Pick<ContentItem, 'title' | 'body' | 'channel' | 'campaignId'>, now = new Date()): ContentItem {
  return { id: `ct_${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 5)}`, status: 'draft', createdAt: now.toISOString(), ...p };
}

/** สัดส่วนเนื้อหาที่ผ่านอนุมัติ (approved+published) ของทั้งคลัง — null ถ้ายังไม่มีเนื้อหา */
export function approvalRate(items: ContentItem[]): number | null {
  if (!items.length) return null;
  const ok = items.filter(i => i.status === 'approved' || i.status === 'published').length;
  return Math.round((ok / items.length) * 100);
}
