import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const WORKSPACE_ID = '98911455-e94f-4212-aa15-70a781e03b4c';
const MAX_BODY_BYTES = 20_000;
const MAX_PROPERTIES_BYTES = 8_000;

const SAFE_BROWSER_EVENTS = new Set([
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
]);

const DEFAULT_ALLOWED_ORIGINS = new Set([
  'https://ceoaithailand.org',
  'https://www.ceoaithailand.org',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SENSITIVE_KEY_RE = /(^|_)(email|phone|mobile|tel|password|passport|national_id|id_card|address|full_name|firstname|lastname|first_name|last_name)($|_)/i;

interface TrackBody {
  eventName?: unknown;
  anonymousId?: unknown;
  sessionId?: unknown;
  campaignId?: unknown;
  contentItemId?: unknown;
  experimentId?: unknown;
  variantId?: unknown;
  audienceSegmentId?: unknown;
  channel?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmContent?: unknown;
  segmentCode?: unknown;
  pagePath?: unknown;
  referrer?: unknown;
  properties?: unknown;
}

function allowedOrigins(): Set<string> {
  const result = new Set(DEFAULT_ALLOWED_ORIGINS);
  const extra = Deno.env.get('MARKETING_TRACK_ALLOWED_ORIGINS');
  for (const raw of extra?.split(',') ?? []) {
    const value = raw.trim();
    if (value) result.add(value);
  }
  return result;
}

function corsHeaders(origin: string): HeadersInit {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'vary': 'Origin',
  };
}

function json(origin: string, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function text(value: unknown, max: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error('invalid_text_field');
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) throw new Error('field_too_long');
  return trimmed;
}

function uuid(value: unknown): string | null {
  const parsed = text(value, 36);
  if (parsed === null) return null;
  if (!UUID_RE.test(parsed)) throw new Error('invalid_uuid');
  return parsed;
}

function safeProperties(value: unknown): Record<string, string | number | boolean | null> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_properties');
  const input = value as Record<string, unknown>;
  const output: Record<string, string | number | boolean | null> = {};

  for (const [key, raw] of Object.entries(input)) {
    if (SENSITIVE_KEY_RE.test(key)) throw new Error('sensitive_property_key');
    if (typeof raw === 'string') output[key.slice(0, 80)] = raw.slice(0, 500);
    else if (typeof raw === 'number' && Number.isFinite(raw)) output[key.slice(0, 80)] = raw;
    else if (typeof raw === 'boolean' || raw === null) output[key.slice(0, 80)] = raw;
  }

  if (new TextEncoder().encode(JSON.stringify(output)).byteLength > MAX_PROPERTIES_BYTES) {
    throw new Error('properties_too_large');
  }
  return output;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? '';
  if (!allowedOrigins().has(origin)) {
    return new Response('Forbidden', { status: 403, headers: { 'cache-control': 'no-store' } });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') return json(origin, 405, { ok: false, error: 'method_not_allowed' });

  const length = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return json(origin, 413, { ok: false, error: 'payload_too_large' });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return json(origin, 400, { ok: false, error: 'invalid_body' });
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json(origin, 413, { ok: false, error: 'payload_too_large' });
  }

  let body: TrackBody;
  try {
    body = JSON.parse(rawBody) as TrackBody;
  } catch {
    return json(origin, 400, { ok: false, error: 'invalid_json' });
  }

  try {
    const eventName = text(body.eventName, 100);
    if (!eventName || !SAFE_BROWSER_EVENTS.has(eventName)) {
      return json(origin, 400, { ok: false, error: 'event_not_allowed' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[marketing-track] missing Supabase service environment');
      return json(origin, 503, { ok: false, error: 'service_unavailable' });
    }

    const rpcPayload = {
      p_workspace_id: WORKSPACE_ID,
      p_event_name: eventName,
      p_anonymous_id: text(body.anonymousId, 200),
      p_session_id: text(body.sessionId, 200),
      p_campaign_id: uuid(body.campaignId),
      p_content_item_id: uuid(body.contentItemId),
      p_experiment_id: uuid(body.experimentId),
      p_variant_id: uuid(body.variantId),
      p_audience_segment_id: uuid(body.audienceSegmentId),
      p_channel: text(body.channel, 100),
      p_utm_source: text(body.utmSource, 255),
      p_utm_medium: text(body.utmMedium, 255),
      p_utm_campaign: text(body.utmCampaign, 255),
      p_utm_content: text(body.utmContent, 255),
      p_segment_code: text(body.segmentCode, 100),
      p_page_path: text(body.pagePath, 1024),
      p_referrer: text(body.referrer, 2048),
      p_properties: safeProperties(body.properties),
    };

    const upstream = await fetch(`${supabaseUrl}/rest/v1/rpc/ingest_marketing_event`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(rpcPayload),
    });

    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 1000);
      console.error('[marketing-track] ingest failed', upstream.status, detail);
      return json(origin, 502, { ok: false, error: 'ingest_failed' });
    }

    const eventId = await upstream.json();
    return json(origin, 202, { ok: true, eventId });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'validation_failed';
    return json(origin, 400, { ok: false, error: code });
  }
});
