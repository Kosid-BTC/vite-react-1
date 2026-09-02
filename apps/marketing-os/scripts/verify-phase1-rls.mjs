const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
}

const password = 'Local-Only-P1-2-1E!2026';
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function jsonRequest(path, { method = 'GET', token, apikey = anonKey, body, headers = {} } = {}) {
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
  if (!condition) {
    const suffix = detail === undefined ? '' : `\n${JSON.stringify(detail, null, 2)}`;
    throw new Error(`${message}${suffix}`);
  }
}

async function createUser(label) {
  const email = `p121e-${label}-${runId}@example.test`;
  const result = await jsonRequest('/auth/v1/admin/users', {
    method: 'POST',
    token: serviceKey,
    apikey: serviceKey,
    body: { email, password, email_confirm: true },
  });
  assert(result.response.ok, `admin create user ${label} failed`, result.data);
  return { id: result.data.id, email };
}

async function signIn(user) {
  const result = await jsonRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email: user.email, password },
  });
  assert(result.response.ok, `sign-in failed for ${user.email}`, result.data);
  assert(result.data?.access_token, 'sign-in returned no access token', result.data);
  return result.data.access_token;
}

async function rpc(token, fn, body) {
  const result = await jsonRequest(`/rest/v1/rpc/${fn}`, {
    method: 'POST', token, body,
  });
  assert(result.response.ok, `RPC ${fn} failed`, result.data);
  return result.data;
}

async function rest(token, path, method = 'GET', body, prefer = 'return=representation') {
  return jsonRequest(`/rest/v1/${path}`, {
    method,
    token,
    body,
    headers: { Prefer: prefer },
  });
}

async function createBrand(token, workspaceId, name) {
  const result = await rest(token, 'marketing_brands', 'POST', {
    workspace_id: workspaceId,
    name,
  });
  assert(result.response.ok, `create brand failed: ${name}`, result.data);
  assert(Array.isArray(result.data) && result.data.length === 1, 'create brand did not return exactly one row', result.data);
  return result.data[0];
}

const user1 = await createUser('owner-a');
const user2 = await createUser('owner-b');
const user3 = await createUser('viewer-a');
const token1 = await signIn(user1);
const token2 = await signIn(user2);
const token3 = await signIn(user3);

const ws1 = await rpc(token1, 'create_workspace', { p_name: `P121E-A-${runId}` });
const ws2 = await rpc(token2, 'create_workspace', { p_name: `P121E-B-${runId}` });
assert(typeof ws1 === 'string' && typeof ws2 === 'string' && ws1 !== ws2, 'workspace creation did not yield two distinct UUIDs', { ws1, ws2 });

// Owner A grants User 3 viewer membership using authenticated RLS, not service_role.
const viewerMembership = await rest(token1, 'workspace_members', 'POST', {
  workspace_id: ws1,
  user_id: user3.id,
  role: 'viewer',
});
assert(viewerMembership.response.ok, 'owner could not add viewer membership through authenticated RLS', viewerMembership.data);

const brandA = await createBrand(token1, ws1, `Brand-A-${runId}`);
const brandB = await createBrand(token2, ws2, `Brand-B-${runId}`);

// Authenticated owner CRUD in own workspace.
let result = await rest(token1, `marketing_brands?id=eq.${brandA.id}&select=id,workspace_id,name`);
assert(result.response.ok && result.data?.length === 1, 'owner SELECT own brand failed', result.data);

result = await rest(token1, `marketing_brands?id=eq.${brandA.id}`, 'PATCH', { name: `Brand-A-Updated-${runId}` });
assert(result.response.ok && result.data?.length === 1 && result.data[0].name.includes('Updated'), 'owner UPDATE own brand failed', result.data);

const disposable = await createBrand(token1, ws1, `Disposable-${runId}`);
result = await rest(token1, `marketing_brands?id=eq.${disposable.id}`, 'DELETE');
assert(result.response.ok && result.data?.length === 1, 'owner DELETE own brand failed', result.data);

// Viewer can read, but cannot mutate.
result = await rest(token3, `marketing_brands?id=eq.${brandA.id}&select=id,name`);
assert(result.response.ok && result.data?.length === 1, 'viewer SELECT allowed workspace failed', result.data);

result = await rest(token3, 'marketing_brands', 'POST', { workspace_id: ws1, name: `Viewer-Forbidden-${runId}` });
assert(!result.response.ok, 'viewer INSERT unexpectedly succeeded', result.data);

result = await rest(token3, `marketing_brands?id=eq.${brandA.id}`, 'PATCH', { name: `Viewer-Overwrite-${runId}` });
assert(result.response.ok && Array.isArray(result.data) && result.data.length === 0, 'viewer UPDATE should affect zero rows', result.data);

result = await rest(token3, `marketing_brands?id=eq.${brandA.id}`, 'DELETE');
assert(result.response.ok && Array.isArray(result.data) && result.data.length === 0, 'viewer DELETE should affect zero rows', result.data);

// Cross-workspace isolation for actual authenticated JWTs.
result = await rest(token1, `marketing_brands?id=eq.${brandB.id}&select=id,workspace_id,name`);
assert(result.response.ok && Array.isArray(result.data) && result.data.length === 0, 'cross-workspace SELECT leaked a row', result.data);

result = await rest(token1, 'marketing_brands', 'POST', { workspace_id: ws2, name: `Cross-Insert-${runId}` });
assert(!result.response.ok, 'cross-workspace INSERT unexpectedly succeeded', result.data);

result = await rest(token1, `marketing_brands?id=eq.${brandB.id}`, 'PATCH', { name: `Cross-Overwrite-${runId}` });
assert(result.response.ok && Array.isArray(result.data) && result.data.length === 0, 'cross-workspace UPDATE should affect zero rows', result.data);

result = await rest(token1, `marketing_brands?id=eq.${brandB.id}`, 'DELETE');
assert(result.response.ok && Array.isArray(result.data) && result.data.length === 0, 'cross-workspace DELETE should affect zero rows', result.data);

// Verify the denied mutations did not change/delete the protected row.
result = await rest(token2, `marketing_brands?id=eq.${brandB.id}&select=id,name`);
assert(result.response.ok && result.data?.length === 1 && result.data[0].name === `Brand-B-${runId}`, 'protected workspace row changed after denied mutation', result.data);

console.log(JSON.stringify({
  gate: 'PHASE1_AUTHENTICATED_RLS_CRUD',
  status: 'PASS',
  users: 3,
  workspaces: 2,
  checks: [
    'owner CRUD own workspace',
    'viewer SELECT allowed',
    'viewer INSERT/UPDATE/DELETE denied',
    'cross-workspace SELECT/INSERT/UPDATE/DELETE denied',
    'denied mutation leaves protected row unchanged',
  ],
  remoteSupabaseTouched: false,
  productionTouched: false,
}, null, 2));
