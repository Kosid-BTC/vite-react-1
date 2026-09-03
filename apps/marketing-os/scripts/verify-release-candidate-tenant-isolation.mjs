import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of requiredEnv) {
  if (!process.env[key]) throw new Error(`Missing ${key}; verifier is local-Supabase only and fails closed`);
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const canonicalVerifier = path.join(currentDir, 'verify-phase1-rls.mjs');
const result = spawnSync(process.execPath, [canonicalVerifier], {
  env: process.env,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'canonical RLS verifier failed\n');
  process.exit(result.status ?? 1);
}

const output = result.stdout.trim();
const jsonStart = output.lastIndexOf('\n{');
const candidate = jsonStart >= 0 ? output.slice(jsonStart + 1) : output;
let evidence;
try {
  evidence = JSON.parse(candidate);
} catch (error) {
  throw new Error(`Unable to parse canonical RLS evidence: ${error instanceof Error ? error.message : String(error)}\n${output}`);
}

const requiredChecks = [
  'owner CRUD own workspace',
  'cross-workspace SELECT/INSERT/UPDATE/DELETE denied',
  'denied mutation leaves protected row unchanged',
];

if (evidence.gate !== 'PHASE1_AUTHENTICATED_RLS_CRUD' || evidence.status !== 'PASS') {
  throw new Error(`Canonical authenticated RLS gate did not PASS: ${JSON.stringify(evidence)}`);
}
if (Number(evidence.users) < 2 || Number(evidence.workspaces) < 2) {
  throw new Error(`Release candidate requires >=2 users and >=2 workspaces: ${JSON.stringify(evidence)}`);
}
for (const check of requiredChecks) {
  if (!Array.isArray(evidence.checks) || !evidence.checks.includes(check)) {
    throw new Error(`Missing required tenant-isolation evidence: ${check}`);
  }
}
if (evidence.remoteSupabaseTouched !== false || evidence.productionTouched !== false) {
  throw new Error('Tenant verifier must remain local-only and production-untouched');
}

console.log(JSON.stringify({
  gate: 'RELEASE_CANDIDATE_MULTI_TENANT_ISOLATION',
  status: 'PASS',
  authPath: 'AUTHENTICATED_JWT',
  users: evidence.users,
  workspaces: evidence.workspaces,
  ownWorkspaceCrud: 'PASS',
  crossWorkspaceSelect: 'DENIED',
  crossWorkspaceInsert: 'DENIED',
  crossWorkspaceUpdate: 'DENIED',
  crossWorkspaceDelete: 'DENIED',
  protectedRowUnchanged: true,
  remoteSupabaseTouched: false,
  productionTouched: false,
}, null, 2));
