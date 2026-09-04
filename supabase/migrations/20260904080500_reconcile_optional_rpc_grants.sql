-- Reconcile production RPC grants where some historical admin functions may be absent.
-- This is intentionally idempotent and existence-guarded so clean/local and drifted production
-- converge without fabricating missing functions.

do $$
declare
  sig text;
begin
  foreach sig in array array[
    'public.create_workspace(text)',
    'public.ensure_default_workspace()',
    'public.invite_member(uuid,text)',
    'public.list_members(uuid)',
    'public.set_member_role(uuid,uuid,text)',
    'public.remove_member(uuid,uuid)',
    'public.admin_list_workspaces()',
    'public.admin_skill_adoption()',
    'public.is_app_admin()',
    'public.is_member(uuid)'
  ]
  loop
    if to_regprocedure(sig) is not null then
      execute format('grant execute on function %s to authenticated', sig);
      execute format('revoke execute on function %s from anon, public', sig);
    end if;
  end loop;

  if to_regprocedure('public.lead_count(text)') is not null then
    grant execute on function public.lead_count(text) to anon, authenticated;
  end if;

  if to_regprocedure('public.delete_workspace(uuid)') is not null then
    grant execute on function public.delete_workspace(uuid) to authenticated;
    revoke execute on function public.delete_workspace(uuid) from anon, public;
  end if;

  if to_regprocedure('public.update_updated_at()') is not null then
    revoke execute on function public.update_updated_at() from anon, authenticated, public;
  end if;
end $$;
