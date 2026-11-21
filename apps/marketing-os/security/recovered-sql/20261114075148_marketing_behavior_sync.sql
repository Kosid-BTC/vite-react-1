-- RECOVERED FROM Production supabase_migrations.schema_migrations, 2026-11-16
-- AUDIT ONLY: do not replay automatically; review dependencies, data writes and security before use.
-- Append-only browser observations. These are not verified sales or revenue.
create table public.marketing_behavior_batches (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id),
  payload_hash text not null,
  payload jsonb not null,
  archive_path text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.marketing_behavior_limits (
  key text primary key, count integer not null, expires_at timestamptz not null
);
create index marketing_behavior_limits_expiry on public.marketing_behavior_limits(expires_at);
alter table public.marketing_behavior_batches enable row level security;
alter table public.marketing_behavior_limits enable row level security;
revoke all on public.marketing_behavior_batches, public.marketing_behavior_limits from anon, authenticated;
grant all on public.marketing_behavior_batches, public.marketing_behavior_limits to service_role;
create index marketing_behavior_batches_workspace_time on public.marketing_behavior_batches(workspace_id, created_at desc);

-- Collector only. Atomic quotas and idempotency; no definer privilege escalation.
create function public.receive_marketing_behavior(p_id uuid,p_workspace uuid,p_hash text,p_payload jsonb,p_path text,p_rate_key text)
returns text language plpgsql security invoker set search_path = '' as $$
declare n integer; old_hash text; k text;
begin
  delete from public.marketing_behavior_limits where key in (select key from public.marketing_behavior_limits where expires_at<now() limit 100);
  if not exists(select 1 from public.workspaces where id=p_workspace and slug='ceo-ai-thailand') then raise exception 'workspace_mismatch'; end if;
  if octet_length(p_payload::text)>16000 or jsonb_typeof(p_payload->'events')<>'array' or jsonb_array_length(p_payload->'events') not between 1 and 20 then raise exception 'invalid_batch'; end if;
  -- Fixed lock order and global daily quota bound abuse and storage costs.
  foreach k in array array['global:'||to_char(now() at time zone 'UTC','YYYYMMDD'),p_rate_key] loop
    insert into public.marketing_behavior_limits(key,count,expires_at) values(k,1,now()+interval '2 days')
      on conflict(key) do update set count=public.marketing_behavior_limits.count+1 returning count into n;
    if n > (case when k like 'global:%' then 10000 else 60 end) then return 'rate_limited'; end if;
  end loop;
  insert into public.marketing_behavior_batches(id,workspace_id,payload_hash,payload,archive_path)
    values(p_id,p_workspace,p_hash,p_payload,p_path) on conflict(id) do nothing;
  select payload_hash into old_hash from public.marketing_behavior_batches where id=p_id;
  if old_hash<>p_hash then return 'conflict'; end if;
  return 'accepted';
end; $$;
revoke all on function public.receive_marketing_behavior(uuid,uuid,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.receive_marketing_behavior(uuid,uuid,text,jsonb,text,text) to service_role;
