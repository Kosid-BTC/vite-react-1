-- CEO AI Marketing OS — keep legacy invite_member compatible with expanded workspace roles.
-- Local/development artifact only until the release gate authorizes remote application.

begin;

create or replace function public.invite_member(p_workspace uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare uid uuid;
begin
  if not exists (
    select 1
    from public.workspaces w
    where w.id = p_workspace
      and w.owner_id = auth.uid()
  ) then
    return 'forbidden';
  end if;

  select id into uid
  from auth.users
  where email = lower(p_email);

  if uid is null then
    return 'not_found';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (p_workspace, uid, 'viewer')
  on conflict (workspace_id, user_id) do nothing;

  return 'ok';
end;
$$;

revoke all on function public.invite_member(uuid, text) from public;
grant execute on function public.invite_member(uuid, text) to authenticated;

commit;
