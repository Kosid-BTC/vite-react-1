/**
 * Supplementary CEO AI Thailand Development database boundary.
 *
 * Target is the independently identified CEO Back Office Development branch,
 * not its parent project. The adapter remains disabled and performs no target
 * Auth, network, or database calls until all security gates pass.
 *
 * Environment values are server-only. Never prefix these with NEXT_PUBLIC_.
 */
import 'server-only';

export const SUPPLEMENTARY_CEO_AI_PROJECT_REF = 'tdeuyycqbbktacmxgktn' as const;
export const SUPPLEMENTARY_CEO_AI_URL =
  'https://tdeuyycqbbktacmxgktn.supabase.co' as const;

export type SupplementaryDatabaseAccess =
  | { enabled: false; reason: 'IDENTITY_MAPPING_UNVERIFIED' }
  | { enabled: false; reason: 'TARGET_RLS_UNVERIFIED' };

/**
 * Fail closed until a separately reviewed adapter proves the identity and
 * tenant authorization boundary. This is NOT a connectivity health check.
 */
export function supplementaryDatabaseAccess(): SupplementaryDatabaseAccess {
  return { enabled: false, reason: 'IDENTITY_MAPPING_UNVERIFIED' };
}
