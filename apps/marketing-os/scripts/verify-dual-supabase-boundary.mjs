// Static regression guard: no credentials, network calls, or database access required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.cwd(), 'src/lib/supabase');
const boundary = readFileSync(resolve(dir, 'supplementary-boundary.ts'), 'utf8');
const adapter = readFileSync(resolve(dir, 'supplementary-readonly.ts'), 'utf8');

const forbiddenCrossProjectAccess =
  /\b(?:fetch|axios|XMLHttpRequest|WebSocket|EventSource)\b|\bcreate(?:Server)?Client\s*\(|\bSupabaseClient\b|\.rpc\s*\(|\.from\s*\(|\.auth\b|SUPABASE_SERVICE_ROLE_KEY|CEO_AI_SUPABASE_PUBLISHABLE_KEY/;

assert.match(boundary, /import 'server-only'/);
assert.match(adapter, /import 'server-only'/);
assert.match(boundary, /enabled: false/);
assert.match(adapter, /supplementaryDatabaseAccess\(\)/);
assert.match(adapter, /WORKSPACE_MAPPING_UNVERIFIED/);

// Runtime input is untrusted: reject null, primitives, arrays and non-string IDs
// before reading nested values or calling trim().
assert.match(adapter, /readSupplementaryBrands\(input: unknown\)/);
assert.match(adapter, /input === null \|\| typeof input !== 'object' \|\| Array\.isArray\(input\)/);
assert.match(adapter, /typeof primaryWorkspaceId !== 'string'/);
assert.match(adapter, /typeof targetWorkspaceId !== 'string'/);
assert.match(adapter, /primaryWorkspaceId\.trim\(\)\.length === 0/);
assert.match(adapter, /targetWorkspaceId\.trim\(\)\.length === 0/);

// Neither the boundary nor adapter may create a client, authenticate against,
// query, or make a network request to the supplementary project before acceptance.
assert.doesNotMatch(boundary, forbiddenCrossProjectAccess);
assert.doesNotMatch(adapter, forbiddenCrossProjectAccess);
assert.doesNotMatch(adapter, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(adapter, /\.(?:insert|update|delete|upsert)\s*\(/);

// This implementation must never return a successful result at runtime.
assert.doesNotMatch(adapter, /return\s*\{\s*ok\s*:\s*true\b/);
assert.match(adapter, /return \{ ok: false, reason: 'WORKSPACE_MAPPING_UNVERIFIED' \}/);

// Compatibility credential is documented as ignored and must never be consumed.
assert.equal((adapter.match(/targetAccessToken/g) ?? []).length, 1);

console.log('PASS: supplementary adapter rejects malformed input, remains server-only and fail-closed, and makes no cross-project network/database call');
