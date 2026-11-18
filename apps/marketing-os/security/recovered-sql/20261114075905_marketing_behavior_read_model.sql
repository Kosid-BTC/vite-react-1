-- RECOVERED FROM Production supabase_migrations.schema_migrations, 2026-11-16
-- AUDIT ONLY: do not replay automatically; review dependencies, data writes and security before use.
create table public.marketing_behavior_events (
 id uuid primary key, workspace_id uuid not null references public.workspaces(id),
 batch_id uuid not null references public.marketing_behavior_batches(id),
 session_id uuid not null, occurred_at timestamptz not null,
 source text not null check(source in ('website','saas')),
 name text not null check(name in ('view','engaged','action')),
 topic text not null check(topic in ('business_validation','first_customer','content_marketing','business_systems')),
 format text not null check(format in ('article','short_video','checklist','interactive')),
 mode text not null check(mode in ('live','test'))
);
create index marketing_behavior_events_workspace_time on public.marketing_behavior_events(workspace_id,occurred_at desc);
alter table public.marketing_behavior_events enable row level security;
revoke all on public.marketing_behavior_events from anon,authenticated;
grant all on public.marketing_behavior_events to service_role;
grant select on public.marketing_behavior_events to authenticated;
create policy marketing_behavior_events_read on public.marketing_behavior_events for select to authenticated using (
 exists(select 1 from public.workspaces w where w.id=workspace_id and w.owner_id=(select auth.uid())) or
 exists(select 1 from public.workspace_members m where m.workspace_id=marketing_behavior_events.workspace_id and m.user_id=(select auth.uid()))
);
create function public.expand_marketing_behavior_batch() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.marketing_behavior_events(id,workspace_id,batch_id,session_id,occurred_at,source,name,topic,format,mode)
 select (e->>'id')::uuid,new.workspace_id,new.id,(e->>'session')::uuid,(e->>'at')::timestamptz,e->>'source',e->>'name',e->>'topic',e->>'format',new.payload->>'mode'
 from jsonb_array_elements(new.payload->'events') e on conflict(id) do nothing;
 return new;
end; $$;
revoke all on function public.expand_marketing_behavior_batch() from public,anon,authenticated;
create trigger expand_marketing_behavior after insert on public.marketing_behavior_batches for each row execute function public.expand_marketing_behavior_batch();
create view public.marketing_behavior_summary with(security_invoker=true) as
 select workspace_id,source,topic,format,count(*)::integer as sessions,
 count(*) filter(where engaged)::integer as engaged_sessions,
 count(*) filter(where acted)::integer as action_sessions,
 max(last_at) as observed_at
 from (
   select workspace_id,source,topic,format,session_id,
   bool_or(name in ('engaged','action')) as engaged,bool_or(name='action') as acted,max(occurred_at) as last_at
   from public.marketing_behavior_events where mode='live' and occurred_at>=now()-interval '30 days'
   group by workspace_id,source,topic,format,session_id
 ) sessions group by workspace_id,source,topic,format;
revoke all on public.marketing_behavior_summary from anon;
grant select on public.marketing_behavior_summary to authenticated,service_role;
