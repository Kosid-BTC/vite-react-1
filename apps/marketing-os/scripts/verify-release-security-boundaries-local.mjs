const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error('Missing local Supabase environment; verifier fails closed');
}

const testPassword = 'Local-Release-Security-2026!';
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function request(path, { method = 'GET', token, apikey = anonKey, body } = {}) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
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

function check(condition, message, detail) {
  if (!condition) throw new Error(`${message}${detail === undefined ? '' : `\n${JSON.stringify(detail, null, 2)}`}`);
}

async function createUser(label) {
  const email = `release-security-${label}-${runId}@example.test`;
  const result = await request('/auth/v1/admin/users', {
    method: 'POST', token: serviceKey, apikey: serviceKey,
    body: { email, password: testPassword, email_confirm: true },
  });
  check(result.response.ok, `create local user ${label} failed`, result.data);
  return { id: result.data.id, email };
}

async function signIn(user) {
  const result = await request('/auth/v1/token?grant_type=password', {
    method: 'POST', body: { email: user.email, password: testPassword },
  });
  check(result.response.ok && result.data?.access_token, `local sign-in failed for ${user.email}`, result.data);
  return result.data.access_token;
}

function rpc(fn, body, token) {
  return request(`/rest/v1/rpc/${fn}`, { method: 'POST', body, token });
}

async function expectRejected(label, result) {
  check(!result.response.ok, `${label} unexpectedly succeeded`, { status: result.response.status, data: result.data });
}

const ownerA = await createUser('owner-a');
const ownerB = await createUser('owner-b');
const tokenA = await signIn(ownerA);
const tokenB = await signIn(ownerB);

const a = await rpc('create_workspace', { p_name: `Security-A-${runId}` }, tokenA);
const b = await rpc('create_workspace', { p_name: `Security-B-${runId}` }, tokenB);
check(a.response.ok && b.response.ok, 'authenticated workspace bootstrap failed', { a: a.data, b: b.data });
const wsA = a.data;
const wsB = b.data;
check(typeof wsA === 'string' && typeof wsB === 'string' && wsA !== wsB, 'expected distinct local workspaces', { wsA, wsB });

const publicDenied = [
  ['create_workspace', { p_name: `Public-${runId}` }],
  ['ensure_default_workspace', {}],
  ['list_members', { p_workspace: wsA }],
  ['set_member_role', { p_workspace: wsA, p_user: ownerB.id, p_role: 'viewer' }],
  ['remove_member', { p_workspace: wsA, p_user: ownerB.id }],
  ['is_member', { ws: wsA }],
];
for (const [fn, body] of publicDenied) await expectRejected(`unauthenticated RPC ${fn}`, await rpc(fn, body));

await expectRejected('authenticated direct trigger helper invocation', await rpc('update_updated_at', {}, tokenA));

const role = await rpc('workspace_role_for', { p_workspace: wsB }, tokenA);
check(role.response.ok && role.data === null, 'cross-workspace role disclosure', role.data);
for (const helper of ['can_edit_workspace', 'can_review_workspace', 'can_manage_workspace']) {
  const result = await rpc(helper, { p_workspace: wsB }, tokenA);
  check(result.response.ok && result.data === false, `${helper} granted cross-workspace access`, result.data);
}
const members = await rpc('list_members', { p_workspace: wsB }, tokenA);
check(!members.response.ok || (Array.isArray(members.data) && members.data.length === 0), 'cross-workspace member disclosure', members.data);

console.log(JSON.stringify({
  gate: 'RELEASE_SECURITY_BOUNDARIES_LOCAL',
  status: 'PASS',
  users: 2,
  workspaces: 2,
  publicRpcDenials: publicDenied.map(([fn]) => fn),
  internalDirectInvocation: 'DENIED',
  crossWorkspaceAuthorization: 'DENIED',
  remoteSupabaseTouched: false,
  productionTouched: false
}, null, 2));
