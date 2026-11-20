import { describe, expect, it } from 'vitest';
import {
  diagnoseMarketingHealth,
  type MarketingMeasurementHealth,
} from '../marketingMeasurement';

function health(overrides: Partial<MarketingMeasurementHealth> = {}): MarketingMeasurementHealth {
  return {
    workspace_id: '00000000-0000-4000-8000-000000000001',
    event_count: 0,
    utm_coverage: 0,
    campaign_id_coverage: 0,
    content_id_coverage: 0,
    attribution_coverage: 0,
    tracking_error_rate: 0,
    latest_event_at: null,
    score: 0,
    reliability: 'unreliable',
    rate_metrics_mature: false,
    min_rate_sample: 100,
    ...overrides,
  };
}

describe('diagnoseMarketingHealth', () => {
  it('บล็อกข้อสรุปเชิงกลยุทธ์เมื่อ Measurement Health unreliable', () => {
    const result = diagnoseMarketingHealth(health({
      event_count: 500,
      score: 45,
      reliability: 'unreliable',
      rate_metrics_mature: true,
      utm_coverage: 20,
      campaign_id_coverage: 90,
      content_id_coverage: 80,
      attribution_coverage: 70,
    }));

    expect(result.tone).toBe('critical');
    expect(result.title).toContain('ไม่น่าเชื่อถือ');
    expect(result.detail).toContain('UTM');
    expect(result.detail).toContain('CPA');
  });

  it('ใช้ count-first เมื่อ sample ยังไม่ถึงเกณฑ์ แม้ tracking score ดี', () => {
    const result = diagnoseMarketingHealth(health({
      event_count: 63,
      score: 95,
      reliability: 'reliable',
      rate_metrics_mature: false,
      utm_coverage: 100,
      campaign_id_coverage: 100,
      content_id_coverage: 100,
      attribution_coverage: 100,
    }));

    expect(result.tone).toBe('warn');
    expect(result.detail).toContain('63');
    expect(result.action).toContain('ยังไม่สรุปอัตรา Conversion');
  });

  it('พร้อม Learning Loop เฉพาะเมื่อ tracking reliable และ sample mature', () => {
    const result = diagnoseMarketingHealth(health({
      event_count: 240,
      score: 96,
      reliability: 'reliable',
      rate_metrics_mature: true,
      utm_coverage: 98,
      campaign_id_coverage: 100,
      content_id_coverage: 100,
      attribution_coverage: 96,
    }));

    expect(result.tone).toBe('good');
    expect(result.title).toContain('Learning Loop');
    expect(result.action).toContain('Experiment');
  });
});
