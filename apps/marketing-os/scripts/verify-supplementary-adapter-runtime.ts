import assert from 'node:assert/strict';
import { readSupplementaryBrands } from '../src/lib/supabase/supplementary-readonly';

const cases: Array<{ name: string; input: unknown; reason: string }> = [
  { name: 'null input', input: null, reason: 'NOT_CONFIGURED' },
  { name: 'undefined input', input: undefined, reason: 'NOT_CONFIGURED' },
  { name: 'array input', input: [], reason: 'NOT_CONFIGURED' },
  { name: 'string input', input: 'workspace', reason: 'NOT_CONFIGURED' },
  { name: 'empty object', input: {}, reason: 'NOT_CONFIGURED' },
  {
    name: 'non-string primary workspace',
    input: { primaryWorkspaceId: 123, targetWorkspaceId: 'target-a' },
    reason: 'NOT_CONFIGURED',
  },
  {
    name: 'blank primary workspace',
    input: { primaryWorkspaceId: '  ', targetWorkspaceId: 'target-a' },
    reason: 'NOT_CONFIGURED',
  },
  {
    name: 'missing target workspace',
    input: { primaryWorkspaceId: 'primary-a' },
    reason: 'NOT_CONFIGURED',
  },
  {
    name: 'valid explicit IDs remain blocked before owner attestation',
    input: { primaryWorkspaceId: 'primary-a', targetWorkspaceId: 'target-a' },
    reason: 'WORKSPACE_MAPPING_UNVERIFIED',
  },
];

async function main(): Promise<void> {
  for (const testCase of cases) {
    const result = await readSupplementaryBrands(testCase.input);
    assert.deepEqual(
      result,
      { ok: false, reason: testCase.reason },
      `unexpected result for ${testCase.name}`,
    );
  }

  console.log(`PASS: supplementary adapter runtime contract (${cases.length} fail-closed cases)`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
