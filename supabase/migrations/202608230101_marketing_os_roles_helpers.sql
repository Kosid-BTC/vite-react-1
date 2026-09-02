-- CEO AI Marketing OS — Phase 1
-- Extend the existing workspace model without recreating it.

begin;

-- Existing deployments used owner/admin/member. Preserve data, then migrate member -> viewer.
alter table public.workspace_members
  drop constraint if exists workspace_members_role_check;

update public.workspace_members
set role = 'viewer'
where role = 'member';

alter table public.workspace_members
  alter column role set default 'viewer';

alter table public.workspace_members
  add constraint workspace_members_role_check
  check (role in ('owner','admin','editor','reviewer','viewer'));

create or replace function public.workspace_role_for(p_workspace uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = p_workspace
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_edit_workspace(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.workspace_role_for(p_workspace) in ('owner','admin','editor'), false);
$$;

create or replace function public.can_review_workspace(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.workspace_role_for(p_workspace) in ('owner','admin','reviewer'), false);
$$;

create or replace function public.can_manage_workspace(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.workspace_role_for(p_workspace) in ('owner','admin'), false);
$$;

-- Update the existing RPC to support the new roles.
create or replace function public.set_member_role(p_workspace uuid, p_user uuid, p_role text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.workspaces w
    where w.id = p_workspace
      and w.owner_id = auth.uid()
  ) then
    return 'forbidden';
  end if;

  if p_role not in ('admin','editor','reviewer','viewer') then
    return 'bad_role';
  end if;

  if exists (
    select 1
    from public.workspaces w
    where w.id = p_workspace
      and w.owner_id = p_user
  ) then
    return 'cannot_change_owner';
  end if;

  update public.workspace_members
  set role = p_role
  where workspace_id = p_workspace
    and user_id = p_user;

  return 'ok';
end;
$$;

revoke all on function public.workspace_role_for(uuid) from public;
revoke all on function public.can_edit_workspace(uuid) from public;
revoke all on function public.can_review_workspace(uuid) from public;
revoke all on function public.can_manage_workspace(uuid) from public;

grant execute on function public.workspace_role_for(uuid) to authenticated;
grant execute on function public.can_edit_workspace(uuid) to authenticated;
grant execute on function public.can_review_workspace(uuid) to authenticated;
grant execute on function public.can_manage_workspace(uuid) to authenticated;

commit;
