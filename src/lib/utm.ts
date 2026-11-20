/** UTM & lineage (Phase B) — ผูก campaign → variant → landing → CTA ลงลิงก์/อีเวนต์ GA4
 *  เก็บเฉพาะแท็กแคมเปญ (ไม่ใช่ข้อมูลส่วนบุคคล) · first-touch เก็บข้ามเซสชันเฉพาะเมื่อผู้ใช้ยินยอมคุกกี้ 'all'
 *  pure builders/parsers = ทดสอบได้ · side-effect (storage) แยกเป็นฟังก์ชันที่ try/catch ทั้งหมด */
import type { MarketingChannelType } from '../types';
import type { MarketingFunnelLineage } from './marketingTruth';
import { validateMarketingLineage } from './marketingTruth';

export interface TrackedLink {
  id: string;
  campaignId: string;
  url: string;
  createdAt: string;
  lineage: MarketingFunnelLineage;
}

export interface Attribution {
  utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string;
  ceo_cmp?: string; ceo_var?: string; ceo_lp?: string; ceo_cta?: string;
  capturedAt: number;
}

const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ceo_cmp', 'ceo_var', 'ceo_lp', 'ceo_cta'] as const;
const STORE_KEY = 'ceo_ai_attr_v1';
const TTL_MS = 30 * 86_400_000;

export const slug = (s: string): string =>
  s.trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

/** ชนิดช่องทาง → (source, medium) มาตรฐานที่ GA4 จัดกลุ่มได้ */
export const CHANNEL_UTM: Record<MarketingChannelType, { source: string; medium: string }> = {
  seo: { source: 'google', medium: 'organic' },
  sem: { source: 'google', medium: 'cpc' },
  social: { source: 'social', medium: 'social' },
  email: { source: 'newsletter', medium: 'email' },
  referral: { source: 'referral', medium: 'referral' },
  content: { source: 'content', medium: 'content' },
  event: { source: 'event', medium: 'offline' },
  partner: { source: 'partner', medium: 'referral' },
};

export interface BuildInput {
  baseUrl: string;
  campaignId: string;
  campaignName: string;
  channelType: MarketingChannelType;
  variantId: string;
  landingPageId: string;
  ctaId: string;
  term?: string;
}

/** สร้างลิงก์ติดตาม — คืน {error} ถ้า lineage ไม่ครบหรือ URL ไม่ถูกต้อง (fail closed ไม่เดาให้) */
export function buildTrackedUrl(i: BuildInput): { url: string; lineage: MarketingFunnelLineage } | { error: string } {
  const lineage: MarketingFunnelLineage = { campaignId: i.campaignId, variantId: i.variantId, landingPageId: i.landingPageId, ctaId: i.ctaId };
  const missing = validateMarketingLineage(lineage);
  if (missing.length) return { error: `lineage ไม่ครบ: ${missing.join(', ')}` };
  let u: URL;
  try { u = new URL(i.baseUrl); } catch { return { error: 'URL ปลายทางไม่ถูกต้อง (ต้องขึ้นต้น https://)' }; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { error: 'รองรับเฉพาะ http/https' };
  const m = CHANNEL_UTM[i.channelType];
  const set = (k: string, v: string) => { if (v) u.searchParams.set(k, v); };
  set('utm_source', m.source);
  set('utm_medium', m.medium);
  set('utm_campaign', slug(i.campaignName) || slug(i.campaignId));
  set('utm_content', `${slug(i.variantId)}_${slug(i.ctaId)}`);
  set('utm_term', i.term ? slug(i.term) : '');
  set('ceo_cmp', i.campaignId); set('ceo_var', i.variantId); set('ceo_lp', i.landingPageId); set('ceo_cta', i.ctaId);
  return { url: u.toString(), lineage };
}

/** อ่านแท็กจาก query string — null ถ้าไม่มี utm_campaign/ceo_cmp (ไม่นับเป็นแคมเปญ) */
export function parseAttribution(search: string, now = Date.now()): Attribution | null {
  const p = new URLSearchParams(search);
  const a: Attribution = { capturedAt: now };
  for (const k of KEYS) { const v = p.get(k); if (v) a[k] = v.slice(0, 100); }
  return a.utm_campaign || a.ceo_cmp ? a : null;
}

let memory: Attribution | null = null;
const consented = (): boolean => { try { return localStorage.getItem('ceo_ai_cookie_consent') === 'all'; } catch { return false; } };

/** first-touch: เก็บครั้งแรกที่มีแท็ก ไม่ทับของเดิมที่ยังไม่หมดอายุ */
export function captureFirstTouch(search: string, now = Date.now()): Attribution | null {
  const existing = getAttribution(now);
  if (existing) return existing;
  const a = parseAttribution(search, now);
  if (!a) return null;
  memory = a;
  if (consented()) { try { localStorage.setItem(STORE_KEY, JSON.stringify(a)); } catch { /* noop */ } }
  return a;
}

export function getAttribution(now = Date.now()): Attribution | null {
  if (memory && now - memory.capturedAt < TTL_MS) return memory;
  if (!consented()) return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Attribution;
    if (typeof a.capturedAt === 'number' && now - a.capturedAt < TTL_MS) return a;
    localStorage.removeItem(STORE_KEY);
  } catch { /* noop */ }
  return null;
}

/** พารามิเตอร์แบนสำหรับแนบกับอีเวนต์ GA4 (ค่า string ล้วน) */
export function attributionParams(a: Attribution | null = getAttribution()): Record<string, string> {
  if (!a) return {};
  const out: Record<string, string> = {};
  for (const k of KEYS) { const v = a[k]; if (v) out[`attr_${k.replace(/^utm_/, '')}`] = v; }
  return out;
}

export function _resetAttributionForTest(): void { memory = null; }
