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

export async function readSupplementaryBrands(input: unknown): Promise<AccessResult> {
  // Runtime inputs are untrusted even when TypeScript callers provide a typed object.
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, reason: 'NOT_CONFIGURED' };
  }

  const values = input as Record<string, unknown>;
  const primaryWorkspaceId = values.primaryWorkspaceId;
  const targetWorkspaceId = values.targetWorkspaceId;

  if (
    typeof primaryWorkspaceId !== 'string' ||
    primaryWorkspaceId.trim().length === 0 ||
    typeof targetWorkspaceId !== 'string' ||
    targetWorkspaceId.trim().length === 0
  ) {
    return { ok: false, reason: 'NOT_CONFIGURED' };
  }

  // targetAccessToken is intentionally ignored; credentials are never portable across projects.
  const gate = supplementaryDatabaseAccess();
  if (!gate.enabled) {
    return { ok: false, reason: 'WORKSPACE_MAPPING_UNVERIFIED' };
  }

  // Deliberately fail closed even if a future boundary flag is changed:
  // implement and test the owner-attestation lookup before adding any target call.
  return { ok: false, reason: 'WORKSPACE_MAPPING_UNVERIFIED' };
}
