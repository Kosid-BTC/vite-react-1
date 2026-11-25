// Static review of the NON-EXECUTABLE Development owner-attestation design template.
// This script reads SQL text only; it never connects to or executes against a database.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const raw = readFileSync(
  resolve(process.cwd(), 'security/development_workspace_mapping_attestations.sql'),
  'utf8',
);
const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
assert.ok(lines.length > 0, 'Mapping template must not be empty');
assert.ok(
  lines.every((line) => /^\s*--/.test(line)),
  'Mapping template must remain comment-only so accidental SQL execution is a no-op',
);

const design = lines.map((line) => line.replace(/^\s*--\s?/, '')).join(' ');
const compact = design.replace(/\s+/g, ' ').toLowerCase();

assert.match(compact, /^non-executable design template\./);
assert.match(compact, /do not execute, apply, or convert this file into a migration/);
assert.match(compact, /create schema if not exists marketing_security/);
assert.match(compact, /create table if not exists marketing_security\.workspace_mapping_attestations/);

for (const required of [
  'primary_project_ref',
  'supplementary_project_ref',
  'primary_workspace_id',
  'supplementary_workspace_id',
  'primary_owner_user_id',
  'supplementary_owner_user_id',
  'primary_consent_event_id',
  'supplementary_consent_event_id',
  'primary_consent_evidence_sha256',
  'supplementary_consent_evidence_sha256',
  'primary_verified_at',
  'supplementary_verified_at',
  'reviewed_by_user_id',
  'reviewed_by',
  'expires_at',
  'revoked_at',
  'revocation_reason',
]) {
  assert.ok(compact.includes(required), `Missing required owner-attestation field: ${required}`);
}

assert.ok(compact.includes("primary_project_ref = 'roprejhnhoaqlctltwfs'"));
assert.ok(compact.includes("supplementary_project_ref = 'tdeuyycqbbktacmxgktn'"));
assert.match(compact, /branch_id e2139d78-2675-4863-ac64-a5fad7c8f826/);
assert.match(compact, /branch_id 2172c0d4-e534-4fe8-918e-5c99ad35ae45/);
assert.match(compact, /status migrations_failed/);
assert.match(compact, /status functions_deployed/);
assert.doesNotMatch(compact, /primary_project_ref = 'bjozpwdtqbpwcxnqguka'/);
assert.doesNotMatch(compact, /supplementary_project_ref = 'waigsnxhrlwtiotspaim'/);

assert.match(compact, /primary_consent_evidence_sha256 ~ '\^\[0-9a-f\]\{64\}\$'/);
assert.match(compact, /supplementary_consent_evidence_sha256 ~ '\^\[0-9a-f\]\{64\}\$'/);
assert.match(compact, /expires_at > greatest\(primary_verified_at, supplementary_verified_at\)/);
assert.match(compact, /\(revoked_at is null\) = \(revocation_reason is null\)/);
assert.match(compact, /revoked_at is null or revoked_at >= created_at/);

assert.match(compact, /primary_workspace_id uuid not null references public\.workspaces\(id\) on delete restrict/);
assert.match(compact, /primary_owner_user_id uuid not null references auth\.users\(id\) on delete restrict/);
assert.match(compact, /reviewed_by_user_id uuid not null references auth\.users\(id\) on delete restrict/);
assert.match(compact, /these fks prove existence only/);
assert.match(compact, /supplementary refs belong to the separate ceo back office development branch and cannot have local foreign keys/);
assert.match(compact, /supplementary_workspace_id uuid not null,/);
assert.match(compact, /supplementary_owner_user_id uuid not null,/);

assert.match(compact, /enable row level security/);
assert.match(compact, /force row level security/);
assert.match(compact, /revoke all on schema marketing_security from public, anon, authenticated, service_role, supabase_read_only_user/);
assert.match(compact, /revoke all on marketing_security\.workspace_mapping_attestations from public, anon, authenticated, service_role, supabase_read_only_user/);
assert.match(compact, /workspace_mapping_primary_active_unique[\s\S]*?where revoked_at is null/);
assert.match(compact, /workspace_mapping_supplementary_active_unique[\s\S]*?where revoked_at is null/);

assert.doesNotMatch(compact, /\bgrant\b/);
assert.doesNotMatch(compact, /\bcreate\s+policy\b/);
assert.doesNotMatch(compact, /\bcreate\s+(?:or\s+replace\s+)?function\b/);
assert.doesNotMatch(compact, /\b(?:drop|truncate)\b/);
assert.doesNotMatch(compact, /\bdisable\s+row\s+level\s+security\b/);

console.log('PASS: Development owner-attestation design is comment-only and pinned to verified branch refs');
