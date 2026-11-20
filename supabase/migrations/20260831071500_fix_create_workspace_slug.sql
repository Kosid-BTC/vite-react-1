-- CEO AI Marketing OS — keep create_workspace compatible with required workspace slugs.
-- Development/PR artifact only until the release gate authorizes any remote application.

begin;

create or replace function public.create_workspace(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid := gen_random_uuid();
  new_slug text := 'ws-' || replace(new_id::text, '-', '');
begin
  insert into public.workspaces (id, name, owner_id, slug)
  values (
    new_id,
    coalesce(nullif(btrim(p_name), ''), 'บริษัทของฉัน'),
    auth.uid(),
    new_slug
  );

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  insert into public.workspace_state (workspace_id, data)
  values (new_id, '{}'::jsonb)
  on conflict (workspace_id) do nothing;

  return new_id;
end;
$$;

revoke all on function public.create_workspace(text) from public;
grant execute on function public.create_workspace(text) to authenticated;

commit;
