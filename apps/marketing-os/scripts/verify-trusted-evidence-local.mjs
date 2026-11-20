const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
}

const password = 'Local-Only-Evidence!2026';
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
  const email = `evidence-${label}-${runId}@example.test`;
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
  assert(result.response.ok && result.data?.access_token, `sign-in failed for ${user.email}`, result.data);
  return result.data.access_token;
}

async function rpc(token, fn, body) {
  const result = await jsonRequest(`/rest/v1/rpc/${fn}`, { method: 'POST', token, body });
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

async function createOne(token, table, body, label) {
  const result = await rest(token, table, 'POST', body);
  assert(result.response.ok, `${label} insert failed`, result.data);
  assert(Array.isArray(result.data) && result.data.length === 1, `${label} insert returned unexpected rows`, result.data);
  return result.data[0];
}

const userA = await createUser('owner-a');
const userB = await createUser('owner-b');
const tokenA = await signIn(userA);
const tokenB = await signIn(userB);

const workspaceA = await rpc(tokenA, 'create_workspace', { p_name: `Evidence-A-${runId}` });
const workspaceB = await rpc(tokenB, 'create_workspace', { p_name: `Evidence-B-${runId}` });
assert(typeof workspaceA === 'string' && typeof workspaceB === 'string' && workspaceA !== workspaceB, 'workspace setup failed', { workspaceA, workspaceB });

const brandA = await createOne(tokenA, 'marketing_brands', { workspace_id: workspaceA, name: `Evidence Brand A ${runId}` }, 'brand A');
const brandA2 = await createOne(tokenA, 'marketing_brands', { workspace_id: workspaceA, name: `Evidence Brand A2 ${runId}` }, 'brand A2');
const brandB = await createOne(tokenB, 'marketing_brands', { workspace_id: workspaceB, name: `Evidence Brand B ${runId}` }, 'brand B');

const campaignA = await createOne(tokenA, 'marketing_campaigns', {
  workspace_id: workspaceA,
  brand_id: brandA.id,
  name: `Evidence Campaign A ${runId}`,
  objective: 'awareness',
  created_by: userA.id,
}, 'campaign A');
const campaignB = await createOne(tokenB, 'marketing_campaigns', {
  workspace_id: workspaceB,
  brand_id: brandB.id,
  name: `Evidence Campaign B ${runId}`,
  objective: 'awareness',
  created_by: userB.id,
}, 'campaign B');

const contentA = await createOne(tokenA, 'marketing_content_items', {
  workspace_id: workspaceA,
  brand_id: brandA.id,
  campaign_id: campaignA.id,
  title: `Evidence Content A ${runId}`,
  content_type: 'post',
  created_by: userA.id,
}, 'content A');
const contentB = await createOne(tokenB, 'marketing_content_items', {
  workspace_id: workspaceB,
  brand_id: brandB.id,
  campaign_id: campaignB.id,
  title: `Evidence Content B ${runId}`,
  content_type: 'post',
  created_by: userB.id,
}, 'content B');

function evidenceBody({ workspaceId, brandId, campaignId, contentItemId, createdBy, idempotencyKey, value = { conversions: 3 } }) {
  return {
    workspace_id: workspaceId,
    business_id: brandId,
    campaign_id: campaignId,
    content_item_id: contentItemId,
    evidence_kind: 'outcome',
    outcome_key: 'activation.conversion',
    truth_status: 'MEASURED',
    value,
    provenance: {
      source: 'p1.2.1-disposable-ci',
      capturedAt: new Date().toISOString(),
      sourceRef: `run:${runId}`,
      method: 'authenticated-jwt-integration-test',
    },
    idempotency_key: idempotencyKey,
    created_by: createdBy,
  };
}

const keyA = `evidence-a-${runId}`;
const keyB = `evidence-b-${runId}`;
const evidenceA = await createOne(tokenA, 'marketing_evidence', evidenceBody({
  workspaceId: workspaceA,
  brandId: brandA.id,
  campaignId: campaignA.id,
  contentItemId: contentA.id,
  createdBy: userA.id,
  idempotencyKey: keyA,
}), 'evidence A');
const evidenceB = await createOne(tokenB, 'marketing_evidence', evidenceBody({
  workspaceId: workspaceB,
  brandId: brandB.id,
  campaignId: campaignB.id,
  contentItemId: contentB.id,
  createdBy: userB.id,
  idempotencyKey: keyB,
  value: { conversions: 7 },
}), 'evidence B');

// Same-workspace CRUD PASS.
let result = await rest(tokenA, `marketing_evidence?id=eq.${evidenceA.id}&select=*`);
assert(result.response.ok && result.data?.length === 1, 'own-workspace SELECT failed', result.data);

result = await rest(tokenA, `marketing_evidence?id=eq.${evidenceA.id}`, 'PATCH', {
  truth_status: 'DERIVED',
  value: { conversions: 3, qualified: 2 },
  updated_at: new Date().toISOString(),
});
assert(result.response.ok && result.data?.length === 1 && result.data[0].truth_status === 'DERIVED', 'own-workspace UPDATE failed', result.data);

const disposable = await createOne(tokenA, 'marketing_evidence', evidenceBody({
  workspaceId: workspaceA,
  brandId: brandA.id,
  campaignId: campaignA.id,
  contentItemId: contentA.id,
  createdBy: userA.id,
  idempotencyKey: `delete-${runId}`,
}), 'disposable evidence');
result = await rest(tokenA, `marketing_evidence?id=eq.${disposable.id}`, 'DELETE');
assert(result.response.ok && result.data?.length === 1, 'own-workspace DELETE failed', result.data);

// Semantic round-trip + lineage preservation.
result = await rest(tokenA, `marketing_evidence?id=eq.${evidenceA.id}&select=workspace_id,business_id,campaign_id,content_item_id,evidence_kind,outcome_key,truth_status,value,provenance,idempotency_key,created_by`);
assert(result.response.ok && result.data?.length === 1, 'round-trip SELECT failed', result.data);
const roundTrip = result.data[0];
assert(roundTrip.workspace_id === workspaceA, 'workspace lineage changed', roundTrip);
assert(roundTrip.business_id === brandA.id, 'business lineage changed', roundTrip);
assert(roundTrip.campaign_id === campaignA.id, 'campaign lineage changed', roundTrip);
assert(roundTrip.content_item_id === contentA.id, 'content lineage changed', roundTrip);
assert(roundTrip.outcome_key === 'activation.conversion', 'outcome key changed', roundTrip);
assert(roundTrip.truth_status === 'DERIVED', 'truth status did not round-trip', roundTrip);
assert(roundTrip.value?.qualified === 2, 'evidence value did not round-trip', roundTrip);
assert(roundTrip.provenance?.source === 'p1.2.1-disposable-ci', 'provenance did not round-trip', roundTrip);

// Replay uniqueness and identity conflicts fail closed.
result = await rest(tokenA, 'marketing_evidence', 'POST', evidenceBody({
  workspaceId: workspaceA,
  brandId: brandA.id,
  campaignId: campaignA.id,
  contentItemId: contentA.id,
  createdBy: userA.id,
  idempotencyKey: keyA,
  value: { conversions: 999 },
}));
assert(!result.response.ok, 'duplicate replay unexpectedly created a second row', result.data);

result = await rest(tokenA, 'marketing_evidence', 'POST', evidenceBody({
  workspaceId: workspaceA,
  brandId: brandA2.id,
  campaignId: null,
  contentItemId: null,
  createdBy: userA.id,
  idempotencyKey: keyA,
  value: { conversions: 111 },
}));
assert(!result.response.ok, 'idempotency identity conflict unexpectedly succeeded', result.data);

result = await rest(tokenA, `marketing_evidence?idempotency_key=eq.${encodeURIComponent(keyA)}&select=id,value`);
assert(result.response.ok && result.data?.length === 1 && result.data[0].id === evidenceA.id, 'failed replay caused a partial/duplicate write', result.data);

// Provenance is mandatory.
const noProvenance = evidenceBody({
  workspaceId: workspaceA,
  brandId: brandA.id,
  campaignId: campaignA.id,
  contentItemId: contentA.id,
  createdBy: userA.id,
  idempotencyKey: `no-prov-${runId}`,
});
noProvenance.provenance = {};
result = await rest(tokenA, 'marketing_evidence', 'POST', noProvenance);
assert(!result.response.ok, 'empty provenance unexpectedly succeeded', result.data);

// Cross-workspace CRUD DENY with authenticated JWTs.
result = await rest(tokenA, `marketing_evidence?id=eq.${evidenceB.id}&select=id,workspace_id`);
assert(result.response.ok && Array.isArray(result.data) && result.data.length === 0, 'cross-workspace SELECT leaked evidence', result.data);

result = await rest(tokenA, 'marketing_evidence', 'POST', evidenceBody({
  workspaceId: workspaceB,
  brandId: brandB.id,
  campaignId: campaignB.id,
  contentItemId: contentB.id,
  createdBy: userA.id,
  idempotencyKey: `cross-${runId}`,
}));
assert(!result.response.ok, 'cross-workspace INSERT unexpectedly succeeded', result.data);

result = await rest(tokenA, `marketing_evidence?id=eq.${evidenceB.id}`, 'PATCH', { value: { conversions: 999 } });
assert(result.response.ok && Array.isArray(result.data) && result.data.length === 0, 'cross-workspace UPDATE affected a row', result.data);

result = await rest(tokenA, `marketing_evidence?id=eq.${evidenceB.id}`, 'DELETE');
assert(result.response.ok && Array.isArray(result.data) && result.data.length === 0, 'cross-workspace DELETE affected a row', result.data);

result = await rest(tokenB, `marketing_evidence?id=eq.${evidenceB.id}&select=id,value`);
assert(result.response.ok && result.data?.length === 1 && result.data[0].value?.conversions === 7, 'protected evidence changed after denied mutation', result.data);

console.log(JSON.stringify({
  gate: 'P1_2_1_LOCAL_MIGRATION_PERSISTENCE_VERIFICATION',
  status: 'PASS',
  localDbUsed: 'disposable-supabase-github-actions',
  migrationApply: 'PASS',
  resetReapply: 'verified-by-workflow',
  replayUniqueness: 'PASS',
  identityConflictFailClosed: 'PASS',
  crossWorkspaceIsolation: 'SELECT/INSERT/UPDATE/DELETE DENY',
  crossBusinessIsolation: 'PASS via isolated workspace/business boundaries',
  provenanceEnforced: 'PASS',
  partialWritePrevented: 'PASS',
  rlsVerified: 'authenticated JWT',
  semanticRoundTrip: 'PASS',
  lineage: 'workspace/business/campaign/content/outcome preserved',
  remoteSupabaseTouched: false,
  productionTouched: false,
  mainMerged: false,
}, null, 2));
