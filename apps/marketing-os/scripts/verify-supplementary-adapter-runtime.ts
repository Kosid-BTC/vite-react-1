import assert from 'node:assert/strict';
import { hasExplicitWorkspaceIds } from '../src/lib/supabase/supplementary-input';

const cases: Array<{ name: string; input: unknown; valid: boolean }> = [
  { name: 'null input', input: null, valid: false },
  { name: 'undefined input', input: undefined, valid: false },
  { name: 'array input', input: [], valid: false },
  { name: 'string input', input: 'workspace', valid: false },
  { name: 'empty object', input: {}, valid: false },
  {
    name: 'non-string primary workspace',
    input: { primaryWorkspaceId: 123, targetWorkspaceId: 'target-a' },
    valid: false,
  },
  {
    name: 'blank primary workspace',
    input: { primaryWorkspaceId: '  ', targetWorkspaceId: 'target-a' },
    valid: false,
  },
  {
    name: 'missing target workspace',
    input: { primaryWorkspaceId: 'primary-a' },
    valid: false,
  },
  {
    name: 'valid explicit workspace IDs',
    input: { primaryWorkspaceId: 'primary-a', targetWorkspaceId: 'target-a' },
    valid: true,
  },
];

for (const testCase of cases) {
  assert.equal(
    hasExplicitWorkspaceIds(testCase.input),
    testCase.valid,
    `unexpected validation result for ${testCase.name}`,
  );
}

console.log(`PASS: explicit supplementary workspace input contract (${cases.length} cases)`);
