import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/app/page.tsx', 'utf8');
const failures = [];
const requirePattern = (pattern, label) => {
  if (!pattern.test(page)) failures.push(`${label}: required explicit-selection behavior is missing`);
};

requirePattern(/\.from\(['"]workspace_members['"]\)/, 'membership lookup');
requirePattern(/\.eq\(['"]user_id['"],\s*user\.id\)/, 'user-scoped membership');
requirePattern(/\.eq\(['"]owner_id['"],\s*user\.id\)/, 'explicit owner lookup');
requirePattern(/new Set\(/, 'deduplicated explicit workspace IDs');
requirePattern(/\.in\(['"]id['"],\s*workspaceIds\)/, 'workspace lookup restricted to explicit IDs');
requirePattern(/accessibleWorkspaces\.length === 1/, 'single-membership redirect');
requirePattern(/accessibleWorkspaces\.length > 1/, 'multi-workspace chooser');
requirePattern(/accessibleWorkspaces\.map\(\(workspace\)/, 'user-selected workspace links');
requirePattern(/href=\{\`\/\$\{workspace\.slug\}\/home\`\}/, 'explicit workspace navigation');

if (/\.limit\(\s*1\s*\)/.test(page)) failures.push('first-row limit is forbidden in the workspace resolver');
if (/\.order\(\s*['"]created_at['"]\s*,\s*\{\s*ascending:\s*true\s*\}\s*\)/.test(page)) {
  failures.push('oldest-workspace ordering is forbidden in the workspace resolver');
}
if (/\.from\(['"]workspaces['"]\)[\s\S]*?\.maybeSingle\(\)/.test(page)) {
  failures.push('unscoped single-workspace selection is forbidden');
}

if (failures.length) {
  console.error('EXPLICIT_WORKSPACE_SELECTION_FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('EXPLICIT_WORKSPACE_SELECTION_PASS');
console.log(JSON.stringify({
  membership: 'current user only',
  ownership: 'current user only',
  oneWorkspace: 'redirect to the only explicit membership',
  multipleWorkspaces: 'require user selection',
  firstWorkspaceFallback: false,
}, null, 2));
