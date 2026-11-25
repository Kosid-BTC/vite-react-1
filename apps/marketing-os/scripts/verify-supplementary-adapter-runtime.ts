import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { hasExplicitWorkspaceIds } from '../src/lib/supabase/supplementary-input';

const requireFromScript = createRequire(__filename);
const moduleApi = requireFromScript('node:module') as {
  _resolveFilename: (request: string, ...args: unknown[]) => string;
};

// Next's server-only package is a build-time marker and is not a direct
// dependency of this app. Stub only that marker for this Node-side contract test;
// the real supplementary-readonly implementation is still loaded and executed.
const originalResolveFilename = moduleApi._resolveFilename;
moduleApi._resolveFilename = function (
  this: unknown,
  request: string,
  ...args: unknown[]
): string {
  if (request === 'server-only') {
    return requireFromScript.resolve('./server-only-test-stub.cjs');
  }
  return originalResolveFilename.call(this, request, ...args);
};

let readSupplementaryBrands: typeof import('../src/lib/supabase/supplementary-readonly').readSupplementaryBrands;
try {
  const adapter = requireFromScript(
    '../src/lib/supabase/supplementary-readonly',
  ) as typeof import('../src/lib/supabase/supplementary-readonly');
  readSupplementaryBrands = adapter.readSupplementaryBrands;
} finally {
  moduleApi._resolveFilename = originalResolveFilename;
}

const primaryWorkspaceId = '8a4f5a34-8a1f-4d31-9e43-5b8c8e1f4c10';
const targetWorkspaceId = 'e2f67a91-6c3b-4e27-a7d2-9f6b8a4c1d30';

const cases: Array<{ name: string; input: unknown; valid: boolean }> = [
  { name: 'null input', input: null, valid: false },
  { name: 'undefined input', input: undefined, valid: false },
  { name: 'array input', input: [], valid: false },
  { name: 'string input', input: 'workspace', valid: false },
  { name: 'empty object', input: {}, valid: false },
  {
    name: 'non-string primary workspace',
    input: { primaryWorkspaceId: 123, targetWorkspaceId },
    valid: false,
  },
  {
    name: 'blank primary workspace',
    input: { primaryWorkspaceId: '  ', targetWorkspaceId },
    valid: false,
  },
  {
    name: 'missing target workspace',
    input: { primaryWorkspaceId },
    valid: false,
  },
  {
    name: 'malformed primary workspace UUID',
    input: { primaryWorkspaceId: 'primary-a', targetWorkspaceId },
    valid: false,
  },
  {
    name: 'malformed target workspace UUID',
    input: { primaryWorkspaceId, targetWorkspaceId: 'target-a' },
    valid: false,
  },
  {
    name: 'valid canonical workspace UUIDs',
    input: { primaryWorkspaceId, targetWorkspaceId },
    valid: true,
  },
  {
    name: 'valid uppercase canonical workspace UUIDs',
    input: {
      primaryWorkspaceId: primaryWorkspaceId.toUpperCase(),
      targetWorkspaceId: targetWorkspaceId.toUpperCase(),
    },
    valid: true,
  },
];

async function main(): Promise<void> {
  for (const testCase of cases) {
    assert.equal(
      hasExplicitWorkspaceIds(testCase.input),
      testCase.valid,
      `unexpected validation result for ${testCase.name}`,
    );
  }

  // Exercise the actual adapter function. The fake token must be ignored and
  // no target Auth, database, or network access may be attempted.
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = async () => {
    networkCalls += 1;
    throw new Error('Unexpected network access in fail-closed adapter test');
  };

  try {
    const invalidResult = await readSupplementaryBrands({
      primaryWorkspaceId: 'not-a-uuid',
      targetWorkspaceId,
    });
    assert.deepEqual(invalidResult, { ok: false, reason: 'NOT_CONFIGURED' });

    const validButUnattestedResult = await readSupplementaryBrands({
      primaryWorkspaceId,
      targetWorkspaceId,
      targetAccessToken: 'intentionally-invalid-test-token',
    });
    assert.deepEqual(validButUnattestedResult, {
      ok: false,
      reason: 'WORKSPACE_MAPPING_UNVERIFIED',
    });
    assert.equal(networkCalls, 0, 'adapter must not access the target network before attestation');
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log(
    `PASS: explicit workspace UUID contract (${cases.length} cases) + actual adapter fail-closed behavior (2 calls, 0 network calls)`,
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
