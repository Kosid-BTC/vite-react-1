-- Release-security reconciliation for production-observed drift.
-- Safe on clean/local and drifted production databases: out-of-band/optional objects are guarded.

-- Workspace RPCs: authenticated-only where they exist. This mirrors the intent of
-- 0027_reconcile_prod_rpc_grants.sql but remains safe when older admin helpers are absent in production.
do $$
begin
  if to_regprocedure('public.create_workspace(text)') is not null then
    execute 'grant execute on function public.create_workspace(text) to authenticated';
    execute 'revoke execute on function public.create_workspace(text) from anon, public';
  end if;
  if to_regprocedure('public.ensure_default_workspace()') is not null then
    execute 'grant execute on function public.ensure_default_workspace() to authenticated';
    execute 'revoke execute on function public.ensure_default_workspace() from anon, public';
  end if;
  if to_regprocedure('public.invite_member(uuid,text)') is not null then
    execute 'grant execute on function public.invite_member(uuid,text) to authenticated';
    execute 'revoke execute on function public.invite_member(uuid,text) from anon, public';
  end if;
  if to_regprocedure('public.list_members(uuid)') is not null then
    execute 'grant execute on function public.list_members(uuid) to authenticated';
    execute 'revoke execute on function public.list_members(uuid) from anon, public';
  end if;
  if to_regprocedure('public.set_member_role(uuid,uuid,text)') is not null then
    execute 'grant execute on function public.set_member_role(uuid,uuid,text) to authenticated';
    execute 'revoke execute on function public.set_member_role(uuid,uuid,text) from anon, public';
  end if;
  if to_regprocedure('public.remove_member(uuid,uuid)') is not null then
    execute 'grant execute on function public.remove_member(uuid,uuid) to authenticated';
    execute 'revoke execute on function public.remove_member(uuid,uuid) from anon, public';
  end if;
  if to_regprocedure('public.admin_list_workspaces()') is not null then
    execute 'grant execute on function public.admin_list_workspaces() to authenticated';
    execute 'revoke execute on function public.admin_list_workspaces() from anon, public';
  end if;
  if to_regprocedure('public.admin_skill_adoption()') is not null then
    execute 'grant execute on function public.admin_skill_adoption() to authenticated';
    execute 'revoke execute on function public.admin_skill_adoption() from anon, public';
  end if;
  if to_regprocedure('public.is_app_admin()') is not null then
    execute 'grant execute on function public.is_app_admin() to authenticated';
    execute 'revoke execute on function public.is_app_admin() from anon, public';
  end if;
  if to_regprocedure('public.is_member(uuid)') is not null then
    execute 'grant execute on function public.is_member(uuid) to authenticated';
    execute 'revoke execute on function public.is_member(uuid) from anon, public';
  end if;
  if to_regprocedure('public.delete_workspace(uuid)') is not null then
    execute 'grant execute on function public.delete_workspace(uuid) to authenticated';
    execute 'revoke execute on function public.delete_workspace(uuid) from anon, public';
  end if;
  if to_regprocedure('public.lead_count(text)') is not null then
    execute 'grant execute on function public.lead_count(text) to anon, authenticated';
  end if;
  if to_regprocedure('public.update_updated_at()') is not null then
    execute 'revoke execute on function public.update_updated_at() from anon, authenticated, public';
  end if;
end
$$;

-- Org authorization helpers are authenticated-only APIs. Anonymous direct invocation is not intended.
do $$
begin
  if to_regprocedure('public.has_org_role(uuid,public.org_role[])') is not null then
    execute 'revoke execute on function public.has_org_role(uuid, public.org_role[]) from anon, public';
    execute 'grant execute on function public.has_org_role(uuid, public.org_role[]) to authenticated';
  end if;

  if to_regprocedure('public.is_org_member(uuid)') is not null then
    execute 'revoke execute on function public.is_org_member(uuid) from anon, public';
    execute 'grant execute on function public.is_org_member(uuid) to authenticated';
  end if;

  -- Internal authorization primitive. SECURITY DEFINER callers execute it as their owner;
  -- clients do not need direct EXECUTE.
  if to_regprocedure('public.is_service_role()') is not null then
    execute 'revoke execute on function public.is_service_role() from anon, authenticated, service_role, public';
  end if;
end
$$;

-- YouTube project credentials/quota state are backend-only. RLS remains enabled as defense in depth;
-- Data API clients receive no table privileges. service_role remains the only application role with DML.
do $$
begin
  if to_regclass('public.youtube_projects') is not null then
    execute 'revoke all on table public.youtube_projects from anon, authenticated';
    execute 'grant select, insert, update, delete on table public.youtube_projects to service_role';
  end if;

  if to_regclass('public.youtube_quota') is not null then
    execute 'revoke all on table public.youtube_quota from anon, authenticated';
    execute 'grant select, insert, update, delete on table public.youtube_quota to service_role';
  end if;
end
$$;

-- pg_net disposition: controlled exception for this release.
-- Existing cron migrations call net.http_post; moving the extension without dependency-safe evidence
-- can break scheduled jobs. Keep the extension location unchanged for this release and re-check after
-- production migration. This migration grants no additional pg_net privileges.
