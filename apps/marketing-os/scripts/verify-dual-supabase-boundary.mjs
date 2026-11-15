// No credentials or production database required: regression guard for cross-project isolation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.cwd(), 'src/lib/supabase');
const boundary = readFileSync(resolve(dir, 'supplementary-boundary.ts'), 'utf8');
const adapter = readFileSync(resolve(dir, 'supplementary-readonly.ts'), 'utf8');

assert.match(boundary, /import 'server-only'/);
assert.match(adapter, /import 'server-only'/);
assert.match(boundary, /enabled: false/);
assert.match(adapter, /primary\.auth\.getUser\(\)/);
assert.match(adapter, /target\.auth\.getUser\(input\.targetAccessToken\)/);
assert.match(adapter, /eq\('user_id', primaryAuth\.user\.id\)/);
assert.match(adapter, /eq\('user_id', targetAuth\.user\.id\)/);
assert.match(adapter, /WORKSPACE_MAPPING_UNVERIFIED/);
assert.doesNotMatch(adapter, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(adapter, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
assert.doesNotMatch(adapter, /return \{ ok: true/);
console.log('PASS: dual Supabase boundary is server-only, read-only and fail-closed');
