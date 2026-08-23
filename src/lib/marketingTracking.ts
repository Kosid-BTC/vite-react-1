const CONSENT_KEY = 'ceo_ai_cookie_consent';
const ANON_ID_KEY = 'ceo_ai_mkt_anon_id';
const SESSION_ID_KEY = 'ceo_ai_mkt_session_id';

export const MARKETING_TRACK_ENDPOINT =
  'https://waigsnxhrlwtiotspaim.supabase.co/functions/v1/marketing-track';

export const BROWSER_MARKETING_EVENTS = [
  'page_view',
  'landing_view',
  'content_view',
  'cta_view',
  'cta_click',
  'calculator_start',
  'calculator_complete',
  'assessment_start',
  'assessment_complete',
  'signup_start',
] as const;

export type BrowserMarketingEvent = (typeof BROWSER_MARKETING_EVENTS)[number];

export interface MarketingTrackContext {
  campaignId?: string;
  contentItemId?: string;
  experimentId?: string;
  variantId?: string;
  audienceSegmentId?: string;
  channel?: string;
  properties?: Record<string, string | number | boolean | null>;
}

export interface MarketingTrackingPayload {
  eventName: BrowserMarketingEvent;
  anonymousId: string;
  sessionId: string;
  campaignId?: string;
  contentItemId?: string;
  experimentId?: string;
  variantId?: string;
  audienceSegmentId?: string;
  channel?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  segmentCode?: string;
  pagePath: string;
  referrer?: string;
  properties: Record<string, string | number | boolean | null>;
}

const LEGACY_EVENT_MAP: Record<string, BrowserMarketingEvent> = {
  landing_cta_click: 'cta_click',
  quickcheck_start: 'calculator_start',
  quickcheck_complete: 'calculator_complete',
  assessment_started: 'assessment_start',
  assessment_completed: 'assessment_complete',
  signup_started: 'signup_start',
};

export function canonicalMarketingEvent(event: string): BrowserMarketingEvent | null {
  if ((BROWSER_MARKETING_EVENTS as readonly string[]).includes(event)) {
    return event as BrowserMarketingEvent;
  }
  return LEGACY_EVENT_MAP[event] ?? null;
}

export function marketingConsentGranted(storage: Pick<Storage, 'getItem'> | null = null): boolean {
  try {
    const target = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    return target?.getItem(CONSENT_KEY) === 'all';
  } catch {
    return false;
  }
}

export function extractMarketingAttribution(url: URL) {
  const value = (key: string, max: number) => {
    const raw = url.searchParams.get(key)?.trim();
    return raw ? raw.slice(0, max) : undefined;
  };

  return {
    utmSource: value('utm_source', 255),
    utmMedium: value('utm_medium', 255),
    utmCampaign: value('utm_campaign', 255),
    utmContent: value('utm_content', 255),
    segmentCode: value('seg', 100),
  };
}

function getOrCreateId(storage: Storage, key: string): string {
  const current = storage.getItem(key);
  if (current) return current.slice(0, 200);
  const id = crypto.randomUUID();
  storage.setItem(key, id);
  return id;
}

function browserTrackingAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (!marketingConsentGranted()) return false;
  if (navigator.doNotTrack === '1') return false;
  return true;
}

export function buildMarketingPayload(
  eventName: BrowserMarketingEvent,
  context: MarketingTrackContext = {},
): MarketingTrackingPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const attribution = extractMarketingAttribution(new URL(window.location.href));
    const anonymousId = getOrCreateId(localStorage, ANON_ID_KEY);
    const sessionId = getOrCreateId(sessionStorage, SESSION_ID_KEY);
    let referrer: string | undefined;
    try {
      referrer = document.referrer ? document.referrer.slice(0, 2048) : undefined;
    } catch {
      referrer = undefined;
    }

    return {
      eventName,
      anonymousId,
      sessionId,
      campaignId: context.campaignId,
      contentItemId: context.contentItemId,
      experimentId: context.experimentId,
      variantId: context.variantId,
      audienceSegmentId: context.audienceSegmentId,
      channel: context.channel ?? attribution.utmSource,
      ...attribution,
      pagePath: window.location.pathname.slice(0, 1024),
      referrer,
      properties: context.properties ?? {},
    };
  } catch {
    return null;
  }
}

export async function trackFirstPartyMarketing(
  eventName: BrowserMarketingEvent,
  context: MarketingTrackContext = {},
): Promise<void> {
  if (!browserTrackingAllowed()) return;
  const payload = buildMarketingPayload(eventName, context);
  if (!payload) return;

  try {
    await fetch(MARKETING_TRACK_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Analytics must never interrupt the product UX.
  }
}

export function initMarketingPageTracking(): void {
  if (!browserTrackingAllowed()) return;
  const event: BrowserMarketingEvent =
    window.location.pathname === '/' || window.location.pathname === '/start'
      ? 'landing_view'
      : 'page_view';
  void trackFirstPartyMarketing(event);
}
