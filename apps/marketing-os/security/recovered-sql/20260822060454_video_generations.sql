-- Recovered from Production migration catalog 2026-11-16; AUDIT ONLY, do not automatically replay
create type video_gen_status as enum ('queued', 'running', 'done', 'failed');

create table video_generations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  channel_id uuid references channels (id) on delete set null,

  prompt text not null,
  aspect text not null check (aspect in ('9:16', '16:9')),
  seconds integer not null check (seconds between 1 and 60),

  provider text not null,
  model text not null,
  tier text not null check (tier in ('lite', 'fast', 'quality')),

  status video_gen_status not null default 'queued',
  provider_job_id text,
  cost_usd numeric(10, 4) not null default 0,
  storage_path text,
  error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index video_generations_org_idx on video_generations (org_id, created_at desc);
create index video_generations_pending_idx on video_generations (status)
  where status in ('queued', 'running');

create trigger video_generations_touch before update on video_generations
  for each row execute function touch_updated_at();

alter table video_generations enable row level security;

create policy video_generations_select on video_generations
  for select to authenticated
  using (is_org_member(org_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('generated-videos', 'generated-videos', false, 536870912, array['video/mp4'])
on conflict (id) do nothing;

create policy "org members read own generated videos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'generated-videos'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );

comment on table video_generations is
  'คลิปโฆษณาสั้นที่โมเดลสร้างให้ทั้งคลิป — แยกจาก videos ซึ่งเป็นคลิปเล่าเรื่องที่ประกอบเอง';
