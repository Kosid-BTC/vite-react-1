-- content_video_jobs — นับโควตาวิดีโอต่อผู้ใช้ต่อวัน (Edge Function content-video เขียน/อ่านด้วย service role เท่านั้น)
-- ไม่มี policy สำหรับ anon/authenticated + revoke สิทธิ์ทั้งหมด → client เข้าตารางนี้ตรง ๆ ไม่ได้
-- idempotent (CI รัน reset/reapply ซ้ำ) · ห้าม apply กับ production จาก workflow นี้ — apply มือตาม docs/ops/supabase-migration.md

begin;

create table if not exists public.content_video_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  model text not null,
  created_at timestamptz not null default now()
);

create index if not exists content_video_jobs_user_day_idx
  on public.content_video_jobs(user_id, created_at desc);

alter table public.content_video_jobs enable row level security;

revoke all on public.content_video_jobs from anon, authenticated;

commit;
