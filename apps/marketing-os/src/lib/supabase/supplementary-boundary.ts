/**
 * Supplementary CEO AI Thailand database boundary.
 *
 * The Marketing OS primary Supabase project remains the only source for
 * authentication, workspace membership and Marketing OS writes.
 *
 * This module intentionally exposes NO query client: Supabase auth tokens,
 * user IDs and workspace IDs are not portable across projects. A verified
 * identity + tenant mapping and target-project RLS review are prerequisites.
 *
 * Environment values are server-only. Never prefix these with NEXT_PUBLIC_.
 */
import 'server-only';

export const SUPPLEMENTARY_CEO_AI_PROJECT_REF = 'waigsnxhrlwtiotspaim' as const;
export const SUPPLEMENTARY_CEO_AI_URL =
  'https://waigsnxhrlwtiotspaim.supabase.co' as const;

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
