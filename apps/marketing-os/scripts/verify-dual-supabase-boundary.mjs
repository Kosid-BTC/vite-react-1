// Static regression guard: no credentials, network calls, or database access required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.cwd(), 'src/lib/supabase');
const boundary = readFileSync(resolve(dir, 'supplementary-boundary.ts'), 'utf8');
const adapter = readFileSync(resolve(dir, 'supplementary-readonly.ts'), 'utf8');
const inputGuard = readFileSync(resolve(dir, 'supplementary-input.ts'), 'utf8');

const forbiddenCrossProjectAccess =
  /\b(?:fetch|axios|XMLHttpRequest|WebSocket|EventSource)\b|\bcreate(?:Server)?Client\s*\(|\bSupabaseClient\b|\.rpc\s*\(|\.from\s*\(|\.auth\b|SUPABASE_SERVICE_ROLE_KEY|CEO_AI_SUPABASE_PUBLISHABLE_KEY/;

assert.match(boundary, /import 'server-only'/);
assert.match(adapter, /import 'server-only'/);
assert.match(boundary, /enabled: false/);
assert.match(adapter, /supplementaryDatabaseAccess\(\)/);
assert.match(adapter, /hasExplicitWorkspaceIds\(input\)/);
assert.match(adapter, /WORKSPACE_MAPPING_UNVERIFIED/);

// The pure input validator rejects null, primitives, arrays and malformed UUIDs.
assert.match(inputGuard, /export function hasExplicitWorkspaceIds\(input: unknown\)/);
assert.match(inputGuard, /input === null \|\| typeof input !== 'object' \|\| Array\.isArray\(input\)/);
assert.match(inputGuard, /const UUID_PATTERN = \/\^\[0-9a-f\]\{8\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{4\}-\[0-9a-f\]\{12\}\$\/i/);
assert.match(inputGuard, /typeof primaryWorkspaceId === 'string'/);
assert.match(inputGuard, /UUID_PATTERN\.test\(primaryWorkspaceId\)/);
assert.match(inputGuard, /typeof targetWorkspaceId === 'string'/);
assert.match(inputGuard, /UUID_PATTERN\.test\(targetWorkspaceId\)/);

// Neither the boundary, adapter nor pure validator may access the supplementary project.
assert.doesNotMatch(boundary, forbiddenCrossProjectAccess);
assert.doesNotMatch(adapter, forbiddenCrossProjectAccess);
assert.doesNotMatch(inputGuard, forbiddenCrossProjectAccess);
assert.doesNotMatch(adapter, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(adapter, /\.(?:insert|update|delete|upsert)\s*\(/);

// This implementation must never return a successful result at runtime.
assert.doesNotMatch(adapter, /return\s*\{\s*ok\s*:\s*true\b/);
assert.match(adapter, /return \{ ok: false, reason: 'WORKSPACE_MAPPING_UNVERIFIED' \}/);

// Compatibility credential is documented as ignored and must never be consumed.
assert.equal((adapter.match(/targetAccessToken/g) ?? []).length, 1);

console.log('PASS: supplementary boundary remains server-only/fail-closed and explicit workspace UUIDs are validated without cross-project access');
