// Static review of the DEVELOPMENT-ONLY owner-attestation SQL proposal.
// This script reads SQL text only; it never connects to or executes against a database.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sql = readFileSync(
  resolve(process.cwd(), 'security/development_workspace_mapping_attestations.sql'),
  'utf8',
);

const compact = sql.replace(/\s+/g, ' ').toLowerCase();

assert.match(compact, /^-- development-only proposal\./);
assert.match(compact, /do not apply to production/);
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

assert.ok(compact.includes("primary_project_ref = 'bjozpwdtqbpwcxnqgktn'"));
assert.ok(compact.includes("supplementary_project_ref = 'waigsnxhrlwtiotspaim'"));
assert.match(compact, /primary_consent_evidence_sha256 ~ '\^\[0-9a-f\]\{64\}\$'/);
assert.match(compact, /supplementary_consent_evidence_sha256 ~ '\^\[0-9a-f\]\{64\}\$'/);
assert.match(compact, /expires_at > greatest\(primary_verified_at, supplementary_verified_at\)/);
assert.match(compact, /\(revoked_at is null\) = \(revocation_reason is null\)/);
assert.match(compact, /revoked_at is null or revoked_at >= created_at/);

// The local (Marketing OS) workspace, owner, and reviewer must exist locally.
// These FKs do not prove owner membership or consent; the trusted verifier still must.
assert.match(compact, /primary_workspace_id uuid not null references public\.workspaces\(id\) on delete restrict/);
assert.match(compact, /primary_owner_user_id uuid not null references auth\.users\(id\) on delete restrict/);
assert.match(compact, /reviewed_by_user_id uuid not null references auth\.users\(id\) on delete restrict/);
assert.match(compact, /these fks prove existence only/);
assert.match(compact, /supplementary refs belong to the separate ceo back office project and cannot have local foreign keys/);
assert.match(compact, /supplementary_workspace_id uuid not null,/);
assert.match(compact, /supplementary_owner_user_id uuid not null,/);
assert.doesNotMatch(compact, /supplementary_(?:workspace|owner_user)_id uuid not null references/);

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

console.log('PASS: Development-only owner-attestation proposal invariants; no SQL was executed');
