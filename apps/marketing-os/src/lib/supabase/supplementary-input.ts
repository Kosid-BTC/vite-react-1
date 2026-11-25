/**
 * Pure validation for explicit supplementary workspace identifiers.
 * Keep this module free of server-only imports so the input contract can be
 * exercised in an isolated Node test without creating any network client.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function hasExplicitWorkspaceIds(input: unknown): boolean {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return false;
  }

  const values = input as Record<string, unknown>;
  const primaryWorkspaceId = values.primaryWorkspaceId;
  const targetWorkspaceId = values.targetWorkspaceId;

  return (
    typeof primaryWorkspaceId === 'string' &&
    UUID_PATTERN.test(primaryWorkspaceId) &&
    typeof targetWorkspaceId === 'string' &&
    UUID_PATTERN.test(targetWorkspaceId)
  );
}
