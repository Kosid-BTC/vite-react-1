import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const ALLOWED_ORIGINS = new Set([
  'https://ceoaithailand.org',
  'https://www.ceoaithailand.org',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const GENERATION_TYPES = new Set([
  'text_to_image',
  'text_to_video',
  'image_to_video',
]);

const PROVIDERS = new Set([
  'openai_image',
  'google_veo',
  'runway',
]);

const ASPECT_RATIOS = new Set(['9:16', '1:1', '16:9']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface RequestBody {
  workspaceId?: unknown;
  contentItemId?: unknown;
  generationType?: unknown;
  provider?: unknown;
  model?: unknown;
  sourceAssetId?: unknown;
  prompt?: unknown;
  motionPrompt?: unknown;
  negativePrompt?: unknown;
  aspectRatio?: unknown;
  durationSeconds?: unknown;
  resolution?: unknown;
  idempotencyKey?: unknown;
  providerOptions?: unknown;
}

function cors(origin: string): HeadersInit {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, apikey, x-client-info',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

function json(origin: string, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(origin),
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function text(value: unknown, max: number, required = false): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error('required_text');
    return null;
  }
  if (typeof value !== 'string') throw new Error('invalid_text');
  const trimmed = value.trim();
  if (!trimmed && required) throw new Error('required_text');
  if (!trimmed) return null;
  if (trimmed.length > max) throw new Error('text_too_long');
  return trimmed;
}

function uuid(value: unknown, required = false): string | null {
  const parsed = text(value, 36, required);
  if (parsed === null) return null;
  if (!UUID_RE.test(parsed)) throw new Error('invalid_uuid');
  return parsed;
}

function number(value: unknown, min: number, max: number): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new Error('invalid_number');
  return parsed;
}

function object(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_object');
  const encoded = JSON.stringify(value);
  if (new TextEncoder().encode(encoded).byteLength > 12_000) throw new Error('object_too_large');
  return value as Record<string, unknown>;
}

function defaultProvider(type: string): string {
  return type === 'text_to_image' ? 'openai_image' : 'google_veo';
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? '';
  for (const extra of (Deno.env.get('MARKETING_GENERATE_ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)) {
    ALLOWED_ORIGINS.add(extra);
  }

  if (!ALLOWED_ORIGINS.has(origin)) {
    return new Response('Forbidden', { status: 403, headers: { 'cache-control': 'no-store' } });
  }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'POST') return json(origin, 405, { ok: false, error: 'method_not_allowed' });

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json(origin, 401, { ok: false, error: 'missing_authorization' });
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > 30_000) {
    return json(origin, 413, { ok: false, error: 'payload_too_large' });
  }

  let body: RequestBody;
  try {
    body = JSON.parse(raw) as RequestBody;
  } catch {
    return json(origin, 400, { ok: false, error: 'invalid_json' });
  }

  try {
    const workspaceId = uuid(body.workspaceId, true)!;
    const contentItemId = uuid(body.contentItemId);
    const generationType = text(body.generationType, 40, true)!;
    if (!GENERATION_TYPES.has(generationType)) throw new Error('unsupported_generation_type');

    const provider = text(body.provider, 80) ?? defaultProvider(generationType);
    if (!PROVIDERS.has(provider)) throw new Error('unsupported_provider');

    const prompt = text(body.prompt, 8000, true)!;
    const sourceAssetId = uuid(body.sourceAssetId);
    if (generationType === 'image_to_video' && !sourceAssetId) {
      throw new Error('source_asset_required');
    }

    const aspectRatio = text(body.aspectRatio, 10) ?? '9:16';
    if (!ASPECT_RATIOS.has(aspectRatio)) throw new Error('unsupported_aspect_ratio');

    const durationSeconds = generationType === 'text_to_image'
      ? null
      : number(body.durationSeconds, 1, 120) ?? 5;

    const model = text(body.model, 120);
    const motionPrompt = text(body.motionPrompt, 4000);
    const negativePrompt = text(body.negativePrompt, 4000);
    const resolution = text(body.resolution, 50);
    const idempotencyKey = text(body.idempotencyKey, 200);
    const providerOptions = object(body.providerOptions);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) {
      console.error('[marketing-generate] missing Supabase environment');
      return json(origin, 503, { ok: false, error: 'service_unavailable' });
    }

    // Preserve the end-user JWT so existing RLS/mkt_can_edit remains the source of truth.
    const headers = {
      apikey: anonKey,
      authorization: authHeader,
      'content-type': 'application/json',
      prefer: 'return=representation',
    };

    if (idempotencyKey) {
      const lookup = await fetch(
        `${supabaseUrl}/rest/v1/marketing_generation_jobs?workspace_id=eq.${workspaceId}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&select=*`,
        { headers },
      );
      if (lookup.ok) {
        const existing = await lookup.json();
        if (Array.isArray(existing) && existing.length > 0) {
          return json(origin, 200, { ok: true, duplicate: true, job: existing[0] });
        }
      }
    }

    const payload = {
      workspace_id: workspaceId,
      content_item_id: contentItemId,
      generation_type: generationType,
      provider,
      model,
      source_asset_id: sourceAssetId,
      prompt,
      motion_prompt: motionPrompt,
      negative_prompt: negativePrompt,
      aspect_ratio: aspectRatio,
      duration_seconds: durationSeconds,
      resolution,
      status: 'queued',
      input: {
        prompt,
        motionPrompt,
        negativePrompt,
        aspectRatio,
        durationSeconds,
        resolution,
      },
      provider_options: providerOptions,
      idempotency_key: idempotencyKey,
    };

    const insert = await fetch(`${supabaseUrl}/rest/v1/marketing_generation_jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!insert.ok) {
      const detail = (await insert.text()).slice(0, 1000);
      console.error('[marketing-generate] queue failed', insert.status, detail);
      const status = insert.status === 401 || insert.status === 403 ? 403 : 502;
      return json(origin, status, { ok: false, error: status === 403 ? 'workspace_forbidden' : 'queue_failed' });
    }

    const rows = await insert.json();
    return json(origin, 202, { ok: true, duplicate: false, job: Array.isArray(rows) ? rows[0] : rows });
  } catch (error) {
    return json(origin, 400, {
      ok: false,
      error: error instanceof Error ? error.message : 'validation_failed',
    });
  }
});
