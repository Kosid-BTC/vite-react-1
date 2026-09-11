-- Marketing OS Functional V5 schema contract alignment
-- Adds the persisted channel source used by the Channels UI and restores
-- tracking-link context fields already written by the application.

begin;

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  niche text,
  youtube_channel_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

alter table public.channels enable row level security;
revoke all on public.channels from anon;
grant select, insert, update, delete on public.channels to authenticated;

drop policy if exists channels_select on public.channels;
create policy channels_select on public.channels
  for select to authenticated
  using (public.is_member(workspace_id));

drop policy if exists channels_insert on public.channels;
create policy channels_insert on public.channels
  for insert to authenticated
  with check (public.can_edit_workspace(workspace_id));

drop policy if exists channels_update on public.channels;
create policy channels_update on public.channels
  for update to authenticated
  using (public.can_edit_workspace(workspace_id))
  with check (public.can_edit_workspace(workspace_id));

drop policy if exists channels_delete on public.channels;
create policy channels_delete on public.channels
  for delete to authenticated
  using (public.can_edit_workspace(workspace_id));

alter table public.marketing_tracking_links
  add column if not exists content_version_id uuid,
  add column if not exists audience_segment_id uuid,
  add column if not exists message_pillar_id uuid,
  add column if not exists offer_id uuid,
  add column if not exists cta_id uuid;

-- Keep context references nullable so legacy links remain valid while new links
-- can preserve the exact approved strategy/content context used at creation time.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'marketing_tracking_links_content_version_fk'
  ) then
    alter table public.marketing_tracking_links
      add constraint marketing_tracking_links_content_version_fk
      foreign key (content_version_id, workspace_id)
      references public.marketing_content_versions(id, workspace_id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'marketing_tracking_links_audience_segment_fk'
  ) then
    alter table public.marketing_tracking_links
      add constraint marketing_tracking_links_audience_segment_fk
      foreign key (audience_segment_id, workspace_id)
      references public.marketing_audience_segments(id, workspace_id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'marketing_tracking_links_message_pillar_fk'
  ) then
    alter table public.marketing_tracking_links
      add constraint marketing_tracking_links_message_pillar_fk
      foreign key (message_pillar_id, workspace_id)
      references public.marketing_message_pillars(id, workspace_id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'marketing_tracking_links_offer_fk'
  ) then
    alter table public.marketing_tracking_links
      add constraint marketing_tracking_links_offer_fk
      foreign key (offer_id, workspace_id)
      references public.marketing_offers(id, workspace_id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'marketing_tracking_links_cta_fk'
  ) then
    alter table public.marketing_tracking_links
      add constraint marketing_tracking_links_cta_fk
      foreign key (cta_id, workspace_id)
      references public.marketing_ctas(id, workspace_id)
      on delete set null;
  end if;
end $$;

commit;
