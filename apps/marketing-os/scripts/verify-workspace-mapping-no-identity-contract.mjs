// Static contract guard for the no-User-DB workspace-mapping design.
// Reads repository text only. It never connects to Supabase or any external API.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const doc = readFileSync(
  resolve(process.cwd(), 'docs/WORKSPACE_MAPPING_OWNER_ATTESTATION_NO_USER_DB.md'),
  'utf8',
);
const sql = readFileSync(
  resolve(process.cwd(), 'security/development_workspace_mapping_attestations.sql'),
  'utf8',
);
const adapter = readFileSync(
  resolve(process.cwd(), 'src/lib/supabase/supplementary-readonly.ts'),
  'utf8',
);

for (const required of [
  'DESIGN ONLY / DEVELOPMENT ONLY / NOT IMPLEMENTED',
  'Do not connect to, query, replicate, or synchronize the website User/Auth database',
  'It does not map people',
  'signed, scoped owner-consent receipt containing no owner subject identifier',
  'NOT APPROVED FOR EXECUTION',
  'No automatic first-workspace',
  'FORCE ROW LEVEL SECURITY',
  'BYPASSRLS',
  'NOT PRODUCTION COMPLETE',
]) {
  assert.ok(doc.includes(required), `Missing no-identity mapping guardrail: ${required}`);
}

const payloadMatch = doc.match(/### Illustrative signed receipt payload[\s\S]*?```json\s*([\s\S]*?)```/);
assert.ok(payloadMatch, 'Illustrative signed receipt JSON must exist');
const receipt = JSON.parse(payloadMatch[1]);
for (const key of [
  'schema_version',
  'issuer',
  'audience',
  'workspace_ref',
  'consent_event_id',
  'scope',
  'challenge_nonce',
  'issued_at',
  'expires_at',
  'revocation_handle',
  'kid',
]) {
  assert.ok(Object.hasOwn(receipt, key), `Receipt is missing ${key}`);
}
for (const forbidden of [
  'sub',
  'owner_user_id',
  'ownerUserId',
  'reviewed_by_user_id',
  'user_id',
  'email',
  'phone',
  'profile',
  'session',
  'jwt',
  'token',
  'customer',
  'lead',
  'contact',
]) {
  assert.equal(Object.hasOwn(receipt, forbidden), false, `Receipt must not contain ${forbidden}`);
}

const sqlLines = sql.split(/\r?\n/).filter((line) => line.trim().length > 0);
assert.ok(sqlLines.length > 0, 'Existing mapping SQL proposal must be present');
assert.ok(
  sqlLines.every((line) => /^\s*--/.test(line)),
  'Mapping SQL proposal must remain comment-only and non-executable',
);

assert.match(adapter, /WORKSPACE_MAPPING_UNVERIFIED/);
assert.match(adapter, /return \{ ok: false, reason: 'WORKSPACE_MAPPING_UNVERIFIED' \}/);
assert.doesNotMatch(
  adapter,
  /\b(?:fetch|axios|XMLHttpRequest|WebSocket|EventSource)\b|create(?:Server)?Client\s*\(|\.rpc\s*\(|\.from\s*\(/,
  'Disabled supplementary adapter must not perform cross-project network or database access',
);

console.log('PASS: no-User-DB owner-attestation contract, comment-only SQL proposal, and fail-closed adapter');
