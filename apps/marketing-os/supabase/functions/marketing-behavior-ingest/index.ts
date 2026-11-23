import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
import { validate, canonical } from './contract.ts';

const workspaceIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const origins = new Set(['https://ceoaithailand.org', 'https://www.ceoaithailand.org']);
let bucketReady: Promise<boolean> | undefined;

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') || '';
  const headers = {
    'Access-Control-Allow-Origin': origins.has(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
  };
  const reply = (status: number, state: string) => Response.json({ state }, { status, headers });

  if (!origins.has(origin)) return reply(403, 'origin_denied');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply(405, 'method_denied');
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415, 'json_required');

  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, 'body_required');
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16000) {
        await reader.cancel();
        return reply(413, 'too_large');
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of chunks) {
      bytes.set(part, offset);
      offset += part.length;
    }

    let batch;
    try {
      batch = validate(JSON.parse(new TextDecoder().decode(bytes)));
    } catch {
      return reply(400, 'invalid_batch');
    }

    // Never reuse a workspace UUID from another Supabase project/environment.
    // Set this value only after the Marketing OS workspace has been owner-attested.
    const workspace = Deno.env.get('MARKETING_OS_WORKSPACE_ID') || '';
    if (!workspaceIdPattern.test(workspace)) return reply(503, 'workspace_unavailable');

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!serviceRoleKey || !supabaseUrl) return reply(503, 'database_unavailable');

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Fail closed unless the configured ID resolves inside this project's canonical workspace.
    const workspaceCheck = await db
      .from('workspaces')
      .select('id')
      .eq('id', workspace)
      .eq('slug', 'ceo-ai-thailand')
      .maybeSingle();
    if (workspaceCheck.error || !workspaceCheck.data) return reply(503, 'workspace_unavailable');

    const payload = canonical(batch);
    const hash = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload)));
    // IP is used only for a keyed, minute-scoped quota; never stored in event payloads.
    const minute = new Date().toISOString().slice(0, 16);
    const hmac = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(serviceRoleKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const rateKey = hex(await crypto.subtle.sign(
      'HMAC',
      hmac,
      new TextEncoder().encode(minute + ':' + (request.headers.get('x-forwarded-for') || 'unknown')),
    ));
    const path = workspace + '/behavior/' + batch.mode + '/' + batch.batchId + '.json';
    const { data, error } = await db.rpc('receive_marketing_behavior', {
      p_id: batch.batchId,
      p_workspace: workspace,
      p_hash: hash,
      p_payload: batch,
      p_path: path,
      p_rate_key: rateKey,
    });
    if (error) return reply(503, 'database_unavailable');
    if (data === 'rate_limited') return reply(429, 'rate_limited');
    if (data === 'conflict') return reply(409, 'batch_conflict');
    if (data !== 'accepted') return reply(503, 'not_accepted');

    // Dedicated private bucket: existing marketing editor upload policies do not apply.
    const bucket = 'marketing-behavior-private';
    bucketReady ??= db.storage.getBucket(bucket).then(async (result) => {
      if (result.data) return result.data.public === false;
      const created = await db.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 16000,
        allowedMimeTypes: ['application/json'],
      });
      if (!created.error) return true;
      const check = await db.storage.getBucket(bucket);
      return check.data?.public === false;
    }).catch(() => false);
    if (!await bucketReady) {
      bucketReady = undefined;
      return reply(503, 'private_archive_unavailable');
    }

    const archived = await db.storage.from(bucket).upload(path, payload, {
      contentType: 'application/json',
      upsert: false,
    });
    if (archived.error) {
      // Confirm bytes, not just object existence, on retry after a successful upload.
      const existing = await db.storage.from(bucket).download(path);
      if (existing.error || await existing.data.text() !== payload) return reply(503, 'archive_pending');
    }
    const saved = await db
      .from('marketing_behavior_batches')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', batch.batchId)
      .eq('payload_hash', hash);
    if (saved.error) return reply(503, 'archive_pending');
    return reply(200, 'stored_and_archived');
  } catch {
    return reply(503, 'temporarily_unavailable');
  }
});
