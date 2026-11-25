import assert from 'node:assert/strict';
import { hasExplicitWorkspaceIds } from '../src/lib/supabase/supplementary-input';

const primaryWorkspaceId = '8a4f5a34-8a1f-4d31-9e43-5b8c8e1f4c10';
const targetWorkspaceId = 'e2f67a91-6c3b-4e27-a7d2-9f6b8a4c1d30';

assert.equal(
  hasExplicitWorkspaceIds(Object.create({ primaryWorkspaceId, targetWorkspaceId })),
  false,
  'inherited workspace identifiers must not satisfy the explicit-input contract',
);
assert.equal(
  hasExplicitWorkspaceIds({ primaryWorkspaceId, targetWorkspaceId }),
  true,
  'own explicit workspace identifiers should satisfy the syntax contract',
);

console.log('PASS: explicit workspace identifiers must be own properties');
