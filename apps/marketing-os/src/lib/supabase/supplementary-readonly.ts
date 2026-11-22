/**
 * Fail-closed supplementary adapter.
 *
 * Cross-project network and database calls are intentionally disabled until
 * the server-owned owner-attestation registry, independent owner verification,
 * and target RLS/RPC acceptance have all passed.
 *
 * Do not infer a workspace from order, name, email, or a matching user ID.
 */
import 'server-only';
import { supplementaryDatabaseAccess } from './supplementary-boundary';

type AccessResult =
  | { ok: false; reason: 'NOT_CONFIGURED' | 'PRIMARY_UNAUTHORIZED' | 'TARGET_UNAUTHORIZED' | 'WORKSPACE_MAPPING_UNVERIFIED' | 'QUERY_FAILED' }
  | { ok: true; rows: Array<{ id: string; name: string }> };

export async function readSupplementaryBrands(input: {
  primaryWorkspaceId: string;
  targetWorkspaceId: string;
  // Kept optional for call-site compatibility; never consumed while the gate is closed.
  targetAccessToken?: string;
}): Promise<AccessResult> {
  if (!input.primaryWorkspaceId?.trim() || !input.targetWorkspaceId?.trim()) {
    return { ok: false, reason: 'NOT_CONFIGURED' };
  }

  const gate = supplementaryDatabaseAccess();
  if (!gate.enabled) {
    return { ok: false, reason: 'WORKSPACE_MAPPING_UNVERIFIED' };
  }

  // Deliberately fail closed even if a future boundary flag is changed:
  // implement and test the owner-attestation lookup before adding any target call.
  return { ok: false, reason: 'WORKSPACE_MAPPING_UNVERIFIED' };
}
