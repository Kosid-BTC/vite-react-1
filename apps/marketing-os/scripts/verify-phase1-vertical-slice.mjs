const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
}

const password = `P1-vertical-${Date.now()}-Aa1!`;
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function request(path, { method = 'GET', token, apikey = anonKey, body, headers = {} } = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  return { response, data };
}

function assert(condition, message, detail) {
  if (!condition) throw new Error(`${message}\n${JSON.stringify(detail ?? null, null, 2)}`);
}

async function rest(token, path, method = 'GET', body, prefer = 'return=representation') {
  return request(`/rest/v1/${path}`, {
    method,
    token,
    body,
    headers: { Prefer: prefer },
  });
}

async function rpc(token, fn, body) {
  const result = await request(`/rest/v1/rpc/${fn}`, { method: 'POST', token, body });
  assert(result.response.ok, `RPC ${fn} failed`, result.data);
  return result.data;
}

const email = `p1-vertical-${runId}@example.test`;
let result = await request('/auth/v1/admin/users', {
  method: 'POST',
  token: serviceKey,
  apikey: serviceKey,
  body: { email, password, email_confirm: true },
});
assert(result.response.ok, 'create test user failed', result.data);
const userId = result.data.id;

result = await request('/auth/v1/token?grant_type=password', {
  method: 'POST',
  body: { email, password },
});
assert(result.response.ok && result.data?.access_token, 'sign-in failed', result.data);
const token = result.data.access_token;

const workspaceId = await rpc(token, 'create_workspace', { p_name: `P1 Vertical ${runId}` });
assert(typeof workspaceId === 'string', 'workspace creation failed', workspaceId);

result = await rest(token, 'marketing_brands', 'POST', {
  workspace_id: workspaceId,
  name: `Vertical Brand ${runId}`,
});
assert(result.response.ok && result.data?.length === 1, 'brand create failed', result.data);
const brand = result.data[0];

result = await rest(token, 'marketing_campaigns', 'POST', {
  workspace_id: workspaceId,
  brand_id: brand.id,
  name: `Vertical Campaign ${runId}`,
  objective: 'first_customer',
  status: 'draft',
  created_by: userId,
});
assert(result.response.ok && result.data?.length === 1, 'campaign create failed', result.data);
const campaign = result.data[0];

result = await rest(token, `marketing_campaigns?id=eq.${campaign.id}`, 'PATCH', { status: 'ready' });
assert(result.response.ok && result.data?.[0]?.status === 'ready', 'campaign update failed', result.data);

result = await rest(token, 'marketing_content_items', 'POST', {
  workspace_id: workspaceId,
  brand_id: brand.id,
  campaign_id: campaign.id,
  title: `Vertical Content ${runId}`,
  content_type: 'post',
  funnel_stage: 'conversion',
  primary_channel: 'owned',
  status: 'draft',
  created_by: userId,
});
assert(result.response.ok && result.data?.length === 1, 'content create failed', result.data);
const content = result.data[0];

result = await rest(token, 'marketing_content_versions', 'POST', {
  workspace_id: workspaceId,
  content_item_id: content.id,
  version_number: 1,
  hook: 'Verified vertical slice',
  body: 'Phase 1 executable acceptance evidence.',
  created_by: userId,
});
assert(result.response.ok && result.data?.length === 1, 'content version create failed', result.data);
const version = result.data[0];

result = await rest(token, 'marketing_approval_requests', 'POST', {
  workspace_id: workspaceId,
  content_item_id: content.id,
  content_version_id: version.id,
  status: 'pending',
  requested_by: userId,
});
assert(result.response.ok && result.data?.length === 1, 'approval request create failed', result.data);
const approval = result.data[0];

result = await rest(token, `marketing_approval_requests?id=eq.${approval.id}`, 'PATCH', {
  status: 'approved',
  reviewed_by: userId,
  review_notes: 'Local CI acceptance test',
  reviewed_at: new Date().toISOString(),
});
assert(result.response.ok && result.data?.[0]?.status === 'approved', 'approval decision failed', result.data);

result = await rest(token, 'marketing_tracking_links', 'POST', {
  workspace_id: workspaceId,
  campaign_id: campaign.id,
  content_item_id: content.id,
  destination_url: 'https://example.test/start',
  utm_source: 'ci',
  utm_medium: 'owned',
  utm_campaign: `phase1-${runId}`,
  utm_content: 'vertical-slice',
  segment_code: 'phase1-ci',
  final_url: `https://example.test/start?utm_source=ci&utm_medium=owned&utm_campaign=phase1-${runId}`,
  created_by: userId,
});
assert(result.response.ok && result.data?.length === 1, 'tracking link create failed', result.data);

const ready = await rpc(token, 'marketing_content_ready', {
  p_content: content.id,
  p_workspace: workspaceId,
});
assert(ready === true, 'content readiness gate did not pass', ready);

result = await rest(token, `marketing_content_items?id=eq.${content.id}&select=id,campaign_id,status`);
assert(result.response.ok && result.data?.length === 1 && result.data[0].campaign_id === campaign.id, 'campaign-content lineage read failed', result.data);

console.log(JSON.stringify({
  gate: 'PHASE1_VERTICAL_SLICE',
  status: 'PASS',
  path: 'authenticated user -> workspace -> brand -> campaign create/update -> content -> version -> approval -> tracking -> ready',
  workspaceId,
  campaignId: campaign.id,
  contentId: content.id,
  productionTouched: false,
}, null, 2));
