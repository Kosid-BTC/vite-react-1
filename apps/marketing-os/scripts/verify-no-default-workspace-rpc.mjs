// Static source guard: application code must never call the legacy first-workspace RPC.
// This does not change the database function; it prevents new app-side invocation paths.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const roots = ['src', 'app', 'pages', 'components', 'server', 'supabase/functions']
  .map((root) => join(process.cwd(), root))
  .filter((root) => existsSync(root));

assert.ok(roots.length > 0, 'No application source roots were found to scan');

const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const forbidden = /\\b(?:ensure_default_workspace|ensureDefaultWorkspace)\\b/;
const violations = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist' || entry.name === 'build') continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!extensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) continue;
    if (entry.name === 'database.types.ts' || entry.name.endsWith('.d.ts')) continue;
    const content = readFileSync(absolute, 'utf8');
    if (forbidden.test(content)) violations.push(relative(process.cwd(), absolute));
  }
}

for (const root of roots) walk(root);

assert.deepEqual(
  violations,
  [],
  'Legacy first-workspace RPC reference found in application source. Require explicit workspace selection instead.',
);
console.log('PASS: application source contains no ensure_default_workspace / ensureDefaultWorkspace call path');
