import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
import { canonical } from '../marketing-behavior-ingest/contract.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const token = request.headers.get('x-maintenance-secret');
  if (!token || token.length > 200) return new Response(null, { status: 401 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return new Response(null, { status: 503 });

  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const config = await db.from('marketing_behavior_config').select('value').eq('key', 'maintenance_hash').single();
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))]
    .map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (config.error || config.data.value !== hash) return new Response(null, { status: 401 });

  const quotaCleanup = await db.from('marketing_behavior_limits').delete().lt('expires_at', new Date().toISOString());
  if (quotaCleanup.error) return Response.json({ state: 'quota_cleanup_pending' }, { status: 503 });

  const bucket = 'marketing-behavior-private';
  let purged = 0;
  let reconciled = 0;
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();

  for (let round = 0; round < 10; round++) {
    const expired = await db.from('marketing_behavior_batches')
      .select('id,archive_path').lt('created_at', cutoff).order('created_at').limit(100);
    if (expired.error) return Response.json({ state: 'database_error' }, { status: 503 });
    if (!expired.data.length) break;

    const paths = expired.data.map((row) => row.archive_path);
    const removed = await db.storage.from(bucket).remove(paths);
    if (removed.error) return Response.json({ state: 'archive_delete_pending' }, { status: 503 });

    // The initial synthetic smoke test used marketing-assets before the privacy bucket was introduced.
    const legacyPaths = paths.filter((path) => path.includes('/behavior/test/'));
    if (legacyPaths.length) {
      const old = await db.storage.from('marketing-assets').remove(legacyPaths);
      if (old.error) return Response.json({ state: 'legacy_test_delete_pending' }, { status: 503 });
    }

    const deleted = await db.from('marketing_behavior_batches').delete().in('id', expired.data.map((row) => row.id));
    if (deleted.error) return Response.json({ state: 'database_delete_pending' }, { status: 503 });
    purged += expired.data.length;
  }

  const pending = await db.from('marketing_behavior_batches')
    .select('id,payload,archive_path').is('archived_at', null).gte('created_at', cutoff).order('created_at').limit(100);
  if (pending.error) return Response.json({ state: 'database_error' }, { status: 503 });

  for (const row of pending.data) {
    const payload = canonical(row.payload);
    // JSONB canonical ordering can differ from the original upload; parse to compare values below.
    const uploaded = await db.storage.from(bucket).upload(row.archive_path, payload, {
      contentType: 'application/json',
      upsert: false,
    });
    if (uploaded.error) {
      const downloaded = await db.storage.from(bucket).download(row.archive_path);
      if (downloaded.error) continue;
      try {
        const actual = JSON.parse(await downloaded.data.text());
        if (canonical(actual) !== payload) continue;
      } catch {
        continue;
      }
    }
    const updated = await db.from('marketing_behavior_batches')
      .update({ archived_at: new Date().toISOString() }).eq('id', row.id);
    if (!updated.error) reconciled++;
  }
  return Response.json({ state: 'complete', purged, reconciled });
});
