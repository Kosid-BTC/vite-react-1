-- Follow-up for production RPC grant drift discovered after the first release-security migration.
-- This migration is additive and immutable; it does not rewrite the already-applied 20260904072500 migration.
-- Every optional/out-of-band function is existence-guarded so the migration is safe on clean CI and drifted production.

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
