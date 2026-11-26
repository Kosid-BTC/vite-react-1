-- SANITIZED, INCOMPLETE, NOT PARITY-READY. Original MD5 176549bce012b698d46c4b72c06e4d4c.
-- The original contains a hardcoded JWT in a cron.schedule statement. Do not commit original.
-- Vault statement creates a new synthetic secret in a test DB; do not run against Production.
-- New behavioral data defaults: administrators only, never public browser reads.
drop policy marketing_behavior_events_read on public.marketing_behavior_events;
create policy marketing_behavior_events_read on public.marketing_behavior_events for select to authenticated using (
 exists(select 1 from public.workspaces w where w.id=workspace_id and w.owner_id=(select auth.uid())) or
 exists(select 1 from public.workspace_members m where m.workspace_id=marketing_behavior_events.workspace_id and m.user_id=(select auth.uid()) and m.role='admin')
);
alter table public.marketing_behavior_events drop constraint marketing_behavior_events_batch_id_fkey;
alter table public.marketing_behavior_events add constraint marketing_behavior_events_batch_id_fkey foreign key(batch_id) references public.marketing_behavior_batches(id) on delete cascade;
create table public.marketing_behavior_config(key text primary key,value text not null);
alter table public.marketing_behavior_config enable row level security;
revoke all on public.marketing_behavior_config from anon,authenticated;
grant select on public.marketing_behavior_config to service_role;
do $$ declare token text:=gen_random_uuid()::text||gen_random_uuid()::text; begin
 perform vault.create_secret(token,'marketing_behavior_maintenance','Hourly private archive reconciliation and 30-day retention');
 insert into public.marketing_behavior_config values('maintenance_hash',encode(sha256(convert_to(token,'UTF8')),'hex'));
end $$;
-- QUARANTINED: Production cron.schedule embeds a literal JWT and calls a Production URL.
-- NEVER replay that statement. In isolated tests use a disabled synthetic stub only.
