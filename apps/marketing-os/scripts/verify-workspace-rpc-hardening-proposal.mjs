// Static-only verifier for NON-EXECUTABLE Development-only workspace RPC design templates.
// This script reads SQL text; it never connects to or executes against Supabase.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (name) => readFileSync(resolve(process.cwd(), 'security', name), 'utf8');
const unwrapCommentTemplate = (name) => {
  const raw = read(name);
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  assert.ok(lines.length > 0, name + ': template must not be empty');
  assert.ok(
    lines.every((line) => /^\s*--/.test(line)),
    name + ': template must remain comment-only so accidental SQL execution is a no-op',
  );
  return lines.map((line) => line.replace(/^\s*--\s?/, '')).join(' ');
};

const normalize = (value) => value.replace(/\s+/g, ' ').toLowerCase();
const marketingSql = normalize(unwrapCommentTemplate('development_marketing_workspace_rpc_hardening.sql'));
const backofficeSql = normalize(unwrapCommentTemplate('development_backoffice_workspace_rpc_hardening.sql'));

const requiredRevocation =
  /revoke all on function public\.ensure_default_workspace\(\) from public, anon, authenticated, service_role, supabase_read_only_user/;

for (const [label, sql, projectRef, branchId, parentRef, status] of [
  ['Marketing OS', marketingSql, 'roprejhnhoaqlctltwfs', 'e2139d78-2675-4863-ac64-a5fad7c8f826', 'bjozpwdtqbpwcxnqguka', 'migrations_failed'],
  ['CEO Back Office', backofficeSql, 'tdeuyycqbbktacmxgktn', '2172c0d4-e534-4fe8-918e-5c99ad35ae45', 'waigsnxhrlwtiotspaim', 'functions_deployed'],
]) {
  assert.match(sql, /^non-executable design template/);
  assert.match(sql, /do not execute, apply, or convert this file into a migration/);
  assert.ok(sql.includes(projectRef), label + ': missing verified Development project ref');
  assert.ok(sql.includes(branchId), label + ': missing verified Development branch ID');
  assert.ok(sql.includes(parentRef), label + ': missing parent project ref metadata');
  assert.ok(sql.includes('status ' + status), label + ': branch status mismatch');
  assert.match(sql, requiredRevocation, label + ': implicit first-workspace RPC must be revoked');
  assert.match(sql, /begin;[\s\S]*commit;/);
  assert.doesNotMatch(sql, /\bgrant\b/);
  assert.doesNotMatch(sql, /\b(?:drop|truncate)\b/);
  assert.doesNotMatch(sql, /disable row level security/);
  assert.doesNotMatch(sql, /create policy/);
  assert.doesNotMatch(sql, /https?:\/\//);
}

assert.match(marketingSql, /create or replace function public\.create_workspace\(p_name text\)/);
assert.match(marketingSql, /security definer set search_path to 'public'/);
assert.match(
  marketingSql,
  /if auth\.uid\(\) is null then raise exception 'unauthorized' using errcode = '42501'; end if;/,
);
assert.match(marketingSql, /insert into public\.workspaces \(name, owner_id\)/);
assert.match(marketingSql, /insert into public\.workspace_members \(workspace_id, user_id, role\)/);
assert.match(marketingSql, /insert into public\.workspace_state \(workspace_id, data\)/);

assert.doesNotMatch(backofficeSql, /create or replace function public\.create_workspace/);

console.log('PASS: Development RPC designs are comment-only and pinned to verified branch refs');
