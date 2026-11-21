-- RECOVERED FROM Production supabase_migrations.schema_migrations, 2026-11-16
-- AUDIT ONLY: do not replay automatically; review dependencies, data writes and security before use.
create table if not exists public.marketing_business_types (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 code text not null check (length(trim(code)) > 0),
 name text not null,
 description text,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id,code),
 unique(id,workspace_id)
);
create table if not exists public.marketing_segment_business_types (
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 segment_id uuid not null,
 business_type_id uuid not null,
 created_at timestamptz not null default now(),
 primary key (segment_id,business_type_id),
 foreign key (segment_id,workspace_id) references public.marketing_audience_segments(id,workspace_id) on delete cascade,
 foreign key (business_type_id,workspace_id) references public.marketing_business_types(id,workspace_id) on delete cascade
);
alter table public.marketing_business_types enable row level security;
alter table public.marketing_segment_business_types enable row level security;
revoke all on public.marketing_business_types from anon,authenticated;
revoke all on public.marketing_segment_business_types from anon,authenticated;
comment on table public.marketing_business_types is 'Business taxonomy, independent of audience pain/intent segmentation; API access withheld pending tenant policy review';
comment on table public.marketing_segment_business_types is 'Optional many-to-many business-type association for audience segments, tenant-scoped via composite foreign keys; API access withheld pending tenant policy review';
