import { describe, expect, it } from 'vitest';
import {
  canonicalMarketingEvent,
  extractMarketingAttribution,
  marketingConsentGranted,
  sanitizeReferrer,
} from '../marketingTracking';

describe('marketingTracking', () => {
  it('map event เดิมไป canonical taxonomy โดยไม่สร้าง event name ใหม่แบบสุ่ม', () => {
    expect(canonicalMarketingEvent('landing_cta_click')).toBe('cta_click');
    expect(canonicalMarketingEvent('quickcheck_start')).toBe('calculator_start');
    expect(canonicalMarketingEvent('quickcheck_complete')).toBe('calculator_complete');
    expect(canonicalMarketingEvent('some_random_event')).toBeNull();
  });

  it('ยอมรับ canonical browser events โดยตรง', () => {
    expect(canonicalMarketingEvent('landing_view')).toBe('landing_view');
    expect(canonicalMarketingEvent('assessment_complete')).toBe('assessment_complete');
  });

  it('แยก UTM + seg จาก URL และตัดช่องว่าง', () => {
    const url = new URL(
      'https://ceoaithailand.org/start?utm_source=tiktok&utm_medium=short_video&utm_campaign=side_income&utm_content=hook_a&seg=employee',
    );
    expect(extractMarketingAttribution(url)).toEqual({
      utmSource: 'tiktok',
      utmMedium: 'short_video',
      utmCampaign: 'side_income',
      utmContent: 'hook_a',
      segmentCode: 'employee',
    });
  });

  it('ไม่เดา UTM เมื่อ URL ไม่มีข้อมูล', () => {
    expect(extractMarketingAttribution(new URL('https://ceoaithailand.org/'))).toEqual({
      utmSource: undefined,
      utmMedium: undefined,
      utmCampaign: undefined,
      utmContent: undefined,
      segmentCode: undefined,
    });
  });

  it('ตัด query/hash จาก referrer เพื่อลดการเก็บข้อมูลเกินจำเป็น', () => {
    expect(sanitizeReferrer('https://example.com/path?a=secret#section')).toBe('https://example.com/path');
    expect(sanitizeReferrer('not-a-url')).toBeUndefined();
  });

  it('first-party analytics เปิดเฉพาะเมื่อ consent = all', () => {
    expect(marketingConsentGranted({ getItem: () => 'all' })).toBe(true);
    expect(marketingConsentGranted({ getItem: () => 'necessary' })).toBe(false);
    expect(marketingConsentGranted({ getItem: () => null })).toBe(false);
  });
});
