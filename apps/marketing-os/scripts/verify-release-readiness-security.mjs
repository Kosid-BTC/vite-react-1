import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(currentDir, '..');
const repoRoot = path.resolve(appRoot, '../..');
const inventoryPath = path.join(appRoot, 'config/security-definer-classification.json');

const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const allowedCategories = new Set([
  'PUBLIC_ANON_ALLOWED',
  'AUTHENTICATED_ALLOWED',
  'SERVICE_ONLY',
  'INTERNAL_ONLY',
]);

if (inventory.schemaVersion !== 1 || inventory.gate !== 'RELEASE_READINESS_SECURITY_INVENTORY') {
  throw new Error('Invalid release-security inventory schema/gate');
}
if (!Array.isArray(inventory.functions) || inventory.functions.length === 0) {
  throw new Error('Security-definer inventory must contain classified functions');
}

const seen = new Set();
for (const entry of inventory.functions) {
  if (!entry.signature || !allowedCategories.has(entry.classification) || !entry.reason) {
    throw new Error(`Invalid classification entry: ${JSON.stringify(entry)}`);
  }
  if (seen.has(entry.signature)) throw new Error(`Duplicate classification: ${entry.signature}`);
  seen.add(entry.signature);
}

const internal = inventory.functions.filter((entry) => entry.classification === 'INTERNAL_ONLY');
const serviceOnly = inventory.functions.filter((entry) => entry.classification === 'SERVICE_ONLY');
const anonAllowed = inventory.functions.filter((entry) => entry.classification === 'PUBLIC_ANON_ALLOWED');
if (anonAllowed.some((entry) => entry.signature !== 'public.lead_count(text)')) {
  throw new Error(`Unexpected anonymous SECURITY DEFINER allowance: ${JSON.stringify(anonAllowed)}`);
}

const grantMigration = fs.readFileSync(path.join(repoRoot, 'supabase/migrations/0027_reconcile_prod_rpc_grants.sql'), 'utf8');
const marketingMigration = fs.readFileSync(path.join(repoRoot, 'supabase/migrations/202608230101_marketing_os_roles_helpers.sql'), 'utf8');

const requiredAnonRevokes = [
  'create_workspace(text)',
  'ensure_default_workspace()',
  'invite_member(uuid, text)',
  'list_members(uuid)',
  'set_member_role(uuid, uuid, text)',
  'remove_member(uuid, uuid)',
  'admin_list_workspaces()',
  'admin_skill_adoption()',
  'is_app_admin()',
  'is_member(uuid)',
];
for (const signature of requiredAnonRevokes) {
  const pattern = new RegExp(`revoke\\s+execute\\s+on\\s+function\\s+public\\.${signature.replace(/[()]/g, '\\$&').replace(/, /g, ',\\s*')}\\s+from\\s+anon,\\s*public`, 'i');
  if (!pattern.test(grantMigration)) throw new Error(`Missing explicit anon/public EXECUTE revoke for ${signature}`);
}

for (const helper of ['workspace_role_for', 'can_edit_workspace', 'can_review_workspace', 'can_manage_workspace']) {
  if (!marketingMigration.includes(`revoke all on function public.${helper}(uuid) from public;`)) {
    throw new Error(`Missing PUBLIC revoke for Marketing OS helper ${helper}`);
  }
  if (!marketingMigration.includes(`grant execute on function public.${helper}(uuid) to authenticated;`)) {
    throw new Error(`Missing authenticated grant for Marketing OS helper ${helper}`);
  }
}

if (!grantMigration.includes('revoke execute on function public.update_updated_at() from anon, authenticated, public;')) {
  throw new Error('Trigger helper update_updated_at must remain direct-client INTERNAL_ONLY');
}

const knownUnclassified = Array.isArray(inventory.knownUnclassifiedProductionSignatures)
  ? inventory.knownUnclassifiedProductionSignatures
  : [];
const directAbuseTests = inventory.directAbuseTests === 'PASS' ? 'PASS' : 'PENDING';
const completeInventory = inventory.completeness === 'COMPLETE' && knownUnclassified.length === 0;
const gatePass = completeInventory && directAbuseTests === 'PASS';

console.log(JSON.stringify({
  gate: 'RELEASE_READINESS_SECURITY',
  status: gatePass ? 'PASS' : 'FAIL',
  releaseReadinessSecurity: gatePass ? 'VERIFIED_PASS' : 'UNVERIFIED',
  completeness: inventory.completeness,
  classifiedFunctions: inventory.functions.length,
  publicAnonAllowed: anonAllowed.map((entry) => entry.signature),
  serviceOnly: serviceOnly.map((entry) => entry.signature),
  internalOnly: internal.map((entry) => entry.signature),
  knownUnclassifiedProductionSignatures: knownUnclassified,
  directAbuseTests,
  productionTouched: false,
  note: gatePass
    ? 'Release-security inventory and direct local abuse-test evidence are complete.'
    : 'Fail-closed: RELEASE_READINESS_SECURITY cannot pass until inventory is COMPLETE, known-unclassified is empty, and direct local abuse tests are PASS.',
}, null, 2));

if (!gatePass) {
  const blockers = [];
  if (inventory.completeness !== 'COMPLETE') blockers.push(`inventory.completeness=${inventory.completeness}`);
  if (knownUnclassified.length > 0) blockers.push(`knownUnclassified=${knownUnclassified.join(',')}`);
  if (directAbuseTests !== 'PASS') blockers.push(`directAbuseTests=${directAbuseTests}`);
  throw new Error(`RELEASE_READINESS_SECURITY fail-closed gate blocked: ${blockers.join('; ')}`);
}
