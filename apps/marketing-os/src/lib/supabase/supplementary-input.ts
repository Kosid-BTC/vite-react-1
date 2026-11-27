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

  try {
    // Read descriptors instead of properties so accessor getters are never
    // invoked. Proxy descriptor traps may throw; fail closed in that case.
    const primaryDescriptor = Object.getOwnPropertyDescriptor(input, 'primaryWorkspaceId');
    const targetDescriptor = Object.getOwnPropertyDescriptor(input, 'targetWorkspaceId');

    if (
      !primaryDescriptor ||
      !targetDescriptor ||
      !Object.prototype.hasOwnProperty.call(primaryDescriptor, 'value') ||
      !Object.prototype.hasOwnProperty.call(targetDescriptor, 'value')
    ) {
      return false;
    }

    const primaryWorkspaceId = primaryDescriptor.value;
    const targetWorkspaceId = targetDescriptor.value;

    return (
      typeof primaryWorkspaceId === 'string' &&
      UUID_PATTERN.test(primaryWorkspaceId) &&
      typeof targetWorkspaceId === 'string' &&
      UUID_PATTERN.test(targetWorkspaceId)
    );
  } catch {
    // Validation must not throw for hostile runtime objects.
    return false;
  }
}
