// Static source guard: application code must never call the legacy first-workspace RPC.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
assert.ok(existsSync(root), 'Marketing OS application root does not exist');

const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const skippedDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  '.vercel',
  'build',
  'coverage',
  'dist',
  'e2e',
  'node_modules',
  'playwright-report',
  'scripts',
  'test',
  'tests',
  '__tests__',
]);
const forbidden = /\b(?:ensure_default_workspace|ensureDefaultWorkspace)\b/;
const violations = [];

// Prove the detector catches both RPC spellings and does not match a longer identifier.
assert.equal(forbidden.test("client.rpc('ensure_default_workspace')"), true);
assert.equal(forbidden.test('ensureDefaultWorkspace()'), true);
assert.equal(forbidden.test('ensure_default_workspace_v2'), false);

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) walk(join(directory, entry.name));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!extensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) continue;
    if (entry.name === 'database.types.ts' || entry.name.endsWith('.d.ts')) continue;
    const absolute = join(directory, entry.name);
    const source = readFileSync(absolute, 'utf8');
    if (forbidden.test(source)) violations.push(relative(root, absolute));
  }
}

walk(root);

assert.deepEqual(
  violations,
  [],
  'Legacy first-workspace RPC reference found in Marketing OS application source. Require explicit workspace selection instead.',
);
console.log('PASS: detector canaries passed and all scanned Marketing OS runtime source contains no first-workspace RPC call path');
