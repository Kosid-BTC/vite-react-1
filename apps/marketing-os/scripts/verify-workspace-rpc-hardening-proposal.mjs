// Static-only verifier for DEVELOPMENT-ONLY workspace RPC hardening proposals.
// This script reads SQL text; it never connects to or executes against Supabase.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (name) =>
  readFileSync(resolve(process.cwd(), 'security', name), 'utf8');

const marketing = read('development_marketing_workspace_rpc_hardening.sql');
const backoffice = read('development_backoffice_workspace_rpc_hardening.sql');

const normalize = (value) => value.replace(/\\s+/g, ' ').toLowerCase();
const marketingSql = normalize(marketing);
const backofficeSql = normalize(backoffice);

const requiredRevocation =
  /revoke all on function public\\.ensure_default_workspace\\(\\) from public, anon, authenticated, service_role, supabase_read_only_user/;

for (const [label, sql, projectRef] of [
  ['Marketing OS', marketingSql, 'bjozpwdtqbpwcxnqguka'],
  ['CEO Back Office', backofficeSql, 'waigsnxhrlwtiotspaim'],
]) {
  assert.match(sql, /^-- development-only proposal/);
  assert.match(sql, /do not apply to production/);
  assert.ok(sql.includes(projectRef), `${label}: missing exact Development project ref`);
  assert.match(sql, requiredRevocation, `${label}: implicit first-workspace RPC must be revoked`);
  assert.match(sql, /begin;[\\s\\s]*commit;/);
  assert.doesNotMatch(sql, /\\bgrant\\b/);
  assert.doesNotMatch(sql, /\\b(?:drop|truncate)\\b/);
  assert.doesNotMatch(sql, /disable row level security/);
  assert.doesNotMatch(sql, /create policy/);
  assert.doesNotMatch(sql, /https?:\\/\\//);
}

assert.match(marketingSql, /create or replace function public\\.create_workspace\\(p_name text\\)/);
assert.match(marketingSql, /security definer set search_path to 'public'/);
assert.match(
  marketingSql,
  /if auth\\.uid\\(\\) is null then raise exception 'unauthorized' using errcode = '42501'; end if;/,
);
assert.match(marketingSql, /insert into public\\.workspaces \\(name, owner_id\\)/);
assert.match(marketingSql, /insert into public\\.workspace_members \\(workspace_id, user_id, role\\)/);
assert.match(marketingSql, /insert into public\\.workspace_state \\(workspace_id, data\\)/);

// CEO Back Office already has the auth.uid() guard; avoid replacing its function here.
assert.doesNotMatch(backofficeSql, /create or replace function public\\.create_workspace/);

console.log('PASS: both Development-only RPC hardening proposals are scoped, fail-closed, and static-only; no SQL was executed');
