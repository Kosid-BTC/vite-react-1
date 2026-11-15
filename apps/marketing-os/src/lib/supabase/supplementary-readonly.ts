/**
 * Read-only cross-project adapter. Both Supabase Auth projects must independently
 * verify the signed-in user and workspace membership before a target read.
 * Never reuse a JWT from one project in the other project.
 */
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './server';
import { SUPPLEMENTARY_CEO_AI_URL } from './supplementary-boundary';

type AccessResult =
  | { ok: false; reason: 'NOT_CONFIGURED' | 'PRIMARY_UNAUTHORIZED' | 'TARGET_UNAUTHORIZED' | 'WORKSPACE_MAPPING_UNVERIFIED' | 'QUERY_FAILED' }
  | { ok: true; rows: Array<{ id: string; name: string }> };

export async function readSupplementaryBrands(input: {
  primaryWorkspaceId: string;
  targetWorkspaceId: string;
  targetAccessToken: string;
}): Promise<AccessResult> {
  const key = process.env.CEO_AI_SUPABASE_PUBLISHABLE_KEY;
  if (!key || !input.primaryWorkspaceId || !input.targetWorkspaceId || !input.targetAccessToken) {
    return { ok: false, reason: 'NOT_CONFIGURED' };
  }

  const primary = await createSupabaseServerClient();
  const { data: primaryAuth, error: primaryAuthError } = await primary.auth.getUser();
  if (primaryAuthError || !primaryAuth.user) return { ok: false, reason: 'PRIMARY_UNAUTHORIZED' };

  const { data: primaryMember, error: primaryMemberError } = await primary
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', input.primaryWorkspaceId)
    .eq('user_id', primaryAuth.user.id)
    .maybeSingle();
  if (primaryMemberError || !primaryMember) return { ok: false, reason: 'PRIMARY_UNAUTHORIZED' };

  const target = createClient(SUPPLEMENTARY_CEO_AI_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${input.targetAccessToken}` } },
  });
  const { data: targetAuth, error: targetAuthError } = await target.auth.getUser(input.targetAccessToken);
  if (targetAuthError || !targetAuth.user) return { ok: false, reason: 'TARGET_UNAUTHORIZED' };

  const { data: targetMember, error: targetMemberError } = await target
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', input.targetWorkspaceId)
    .eq('user_id', targetAuth.user.id)
    .maybeSingle();
  if (targetMemberError || !targetMember) return { ok: false, reason: 'TARGET_UNAUTHORIZED' };

  // Membership in two projects is NOT proof that the workspaces correspond.
  // Mapping must be attested by a separately reviewed, server-owned mapping
  // registry before enabling a cross-project read.
  return { ok: false, reason: 'WORKSPACE_MAPPING_UNVERIFIED' };
}
