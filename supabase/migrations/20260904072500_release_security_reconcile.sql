-- Release-security reconciliation for production-observed drift.
-- Safe on clean/local databases: every out-of-band object is guarded.

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
