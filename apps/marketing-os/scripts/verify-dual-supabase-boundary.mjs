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

// Neither the boundary nor adapter may create a client, authenticate against,
// query, or make a network request to the supplementary project before acceptance.
assert.doesNotMatch(boundary, forbiddenCrossProjectAccess);
assert.doesNotMatch(adapter, forbiddenCrossProjectAccess);
assert.doesNotMatch(adapter, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(adapter, /\.(?:insert|update|delete|upsert)\s*\(/);

// This implementation must never return a successful result at runtime.
assert.doesNotMatch(adapter, /return\s*\{\s*ok\s*:\s*true\b/);
assert.match(adapter, /return \{ ok: false, reason: 'WORKSPACE_MAPPING_UNVERIFIED' \}/);

// Compatibility token may exist in the input type, but must not be consumed.
assert.equal((adapter.match(/targetAccessToken/g) ?? []).length, 1);

console.log('PASS: supplementary boundary and adapter remain server-only, fail-closed, and make no cross-project network/database call');
