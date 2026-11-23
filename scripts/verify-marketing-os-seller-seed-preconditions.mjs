import fs from 'node:fs';

const path = 'supabase/migrations/20261116014116_seed_ceo_ai_thailand_seller_audience_hypothesis.sql';
const sql = fs.readFileSync(path, 'utf8');
const normalized = sql.toLowerCase();
const failures = [];

const requireText = (needle, label) => {
  if (!normalized.includes(needle.toLowerCase())) failures.push(`${label}: missing "${needle}"`);
};

const forbid = (pattern, label) => {
  if (pattern.test(sql)) failures.push(label);
};

forbid(/\binto\s+strict\b/i, 'must not use INTO STRICT for optional seed prerequisites');
forbid(/insert\s+into\s+public\.workspaces\b/i, 'must not fabricate a workspace');
forbid(/insert\s+into\s+public\.marketing_brands\b/i, 'must not fabricate a brand');

requireText('select count(*)', 'workspace/brand cardinality guards');
requireText('into workspace_matches', 'workspace cardinality guard');
requireText('into brand_matches', 'brand cardinality guard');
requireText('if workspace_matches = 0 then', 'missing workspace no-op');
requireText('if brand_matches = 0 then', 'missing brand no-op');
requireText('raise notice', 'explicit skipped-seed evidence');
requireText('workspace_matches > 1', 'ambiguous workspace fail-closed guard');
requireText('brand_matches > 1', 'ambiguous brand fail-closed guard');
requireText('insert into public.marketing_audience_segments', 'seller hypothesis insert');
requireText("'seller'", 'seller hypothesis code');
requireText("'hypothesis'", 'seller hypothesis evidence status');
requireText('on conflict (brand_id, code) do update', 'idempotent seller hypothesis upsert');

if (failures.length) {
  console.error('SELLER_SEED_PRECONDITION_GUARD_FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('SELLER_SEED_PRECONDITION_GUARD_PASS');
console.log(JSON.stringify({
  missingWorkspaceOrBrand: 'NOTICE + no seed row',
  duplicateWorkspaceOrBrand: 'FAIL CLOSED',
  workspaceOrBrandCreation: false,
  sellerEvidenceStatus: 'hypothesis',
}, null, 2));
