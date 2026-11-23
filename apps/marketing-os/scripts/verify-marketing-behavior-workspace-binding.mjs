import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const ingest = readFileSync(resolve(root, 'supabase/functions/marketing-behavior-ingest/index.ts'), 'utf8');
const maintenance = readFileSync(resolve(root, 'supabase/functions/marketing-behavior-maintenance/index.ts'), 'utf8');
const config = readFileSync(resolve(root, 'supabase/config.toml'), 'utf8');

assert.doesNotMatch(ingest, /e82e7d93-b88e-48ff-9364-b54bcff5278d/i, 'Production workspace UUID must not be hard-coded');
assert.match(ingest, /Deno\.env\.get\(['"]MARKETING_OS_WORKSPACE_ID['"]\)/, 'workspace must come from explicit environment binding');
assert.match(ingest, /workspaceIdPattern\.test\(workspace\)/, 'workspace binding must be validated as UUID');
assert.match(ingest, /\.eq\(['"]slug['"],\s*['"]ceo-ai-thailand['"]\)/, 'workspace must resolve to canonical slug in this project');
assert.match(ingest, /reply\(503,\s*['"]workspace_unavailable['"]\)/, 'missing/mismatched workspace must fail closed');
assert.match(ingest, /p_workspace:\s*workspace/, 'RPC must use the verified environment-local workspace');
assert.match(maintenance, /Deno\.env\.get\(['"]SUPABASE_URL['"]\)/, 'maintenance function must use its own project URL');
assert.doesNotMatch(maintenance, /bjozpwdtqbpwcxnqguka\.supabase\.co/i, 'maintenance source must not hard-code Production endpoint');
assert.match(config, /\[functions\.marketing-behavior-ingest\][\s\S]*?verify_jwt\s*=\s*true/);
assert.match(config, /\[functions\.marketing-behavior-maintenance\][\s\S]*?verify_jwt\s*=\s*true/);
assert.doesNotMatch(config, /^\s*project_id\s*=/m, 'Marketing OS config must not inherit another project ref');

console.log('MARKETING_OS_EDGE_FUNCTION_WORKSPACE_BINDING_PASS');
console.log(JSON.stringify({
  workspaceSource: 'MARKETING_OS_WORKSPACE_ID',
  workspaceValidation: 'local project + slug ceo-ai-thailand',
  productionWorkspaceFallback: false,
  productionEndpointHardcoding: false,
  verifyJwt: true,
  projectRef: 'must be explicit at CLI invocation',
}, null, 2));
