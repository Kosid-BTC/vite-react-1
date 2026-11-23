-- DEVELOPMENT-ONLY PROPOSAL for Marketing OS project bjozpwdtqbpwcxnqguka.
-- DO NOT APPLY TO PRODUCTION.
-- Apply only after a verified backup, PostgreSQL 17 isolated restore, schema parity,
-- and application/external-client callsite review. This file is not a migration.
-- It is intentionally scoped to the Marketing OS Development database.
--
-- Evidence basis (read-only catalog audit, 2026-11-23 UTC):
-- public.ensure_default_workspace() is SECURITY DEFINER and executable by authenticated.
-- It selects the earliest membership and creates a Personal Workspace when none exists.
-- No database function source references it; the repository's no-default-workspace
-- source guard also passes on the current PR head.
-- public.create_workspace(text) is SECURITY DEFINER and lacks an explicit auth.uid()
-- NULL guard here; CEO Back Office Development already has that guard.
--
-- This proposal does not create a mapping, read another project, or enable cross-project access.

begin;

-- Remove API-role execution of implicit first-workspace selection.
revoke all on function public.ensure_default_workspace()
  from public, anon, authenticated, service_role, supabase_read_only_user;

-- Keep workspace creation available to its existing authorized callers, but make
-- the authenticated identity requirement explicit inside the SECURITY DEFINER body.
create or replace function public.create_workspace(p_name text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  insert into public.workspaces (name, owner_id)
  values (coalesce(nullif(p_name, ''), 'บริษัทของฉัน'), auth.uid())
  returning id into new_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  insert into public.workspace_state (workspace_id, data)
  values (new_id, '{}'::jsonb)
  on conflict (workspace_id) do nothing;

  return new_id;
end;
$function$;

commit;
