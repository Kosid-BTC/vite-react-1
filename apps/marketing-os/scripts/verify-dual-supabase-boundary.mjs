// Static regression guard: no credentials, network calls, or database access required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.cwd(), 'src/lib/supabase');
const boundary = readFileSync(resolve(dir, 'supplementary-boundary.ts'), 'utf8');
const adapter = readFileSync(resolve(dir, 'supplementary-readonly.ts'), 'utf8');

assert.match(boundary, /import 'server-only'/);
assert.match(adapter, /import 'server-only'/);
assert.match(boundary, /enabled: false/);
assert.match(adapter, /supplementaryDatabaseAccess\(\)/);
assert.match(adapter, /WORKSPACE_MAPPING_UNVERIFIED/);
assert.doesNotMatch(adapter, /createClient|SUPPLEMENTARY_CEO_AI_URL|CEO_AI_SUPABASE_PUBLISHABLE_KEY/);
assert.doesNotMatch(adapter, /target\.auth\.|target\s*\.from\(|\.auth\.getUser\(|\.from\(/);
assert.doesNotMatch(adapter, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(adapter, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
assert.doesNotMatch(adapter, /return \{ ok: true/);
console.log('PASS: supplementary adapter makes no cross-project network or database call while mapping/RLS gates are closed');
