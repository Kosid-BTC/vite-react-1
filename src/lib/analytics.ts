/** GA4 funnel events + first-party marketing measurement.
 *  gtag โหลดจาก index.html (G-CHJ99RY1Q1) — wrapper นี้ no-op ถ้าไม่มี (local/บล็อก ads)
 *
 *  GA4 ยังคงรับ event เดิมเพื่อไม่ทำลาย dashboard/report ที่มีอยู่
 *  ส่วน first-party จะรับเฉพาะ event ที่ map เข้าสู่ canonical taxonomy เท่านั้น
 *  และส่งต่อเมื่อผู้ใช้ยินยอม Analytics แล้วเท่านั้น
 */

import {
  canonicalMarketingEvent,
  trackFirstPartyMarketing,
} from './marketingTracking';

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export function track(event: string, params: Record<string, string | number> = {}) {
  try {
    window.gtag?.('event', event, params);
  } catch { /* ห้ามทำ UX พัง เพราะ analytics */ }

  const canonical = canonicalMarketingEvent(event);
  if (!canonical) return;

  void trackFirstPartyMarketing(canonical, {
    properties: params,
  });
}
