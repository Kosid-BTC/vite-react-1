-- CEO AI Marketing OS — Phase 1 Campaign + Content
begin;

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null,
  name text not null,
  objective text not null check (objective in ('awareness','interest','first_customer','sales')),
  audience_segment_id uuid,
  message_pillar_id uuid,
  offer_id uuid,
  cta_id uuid,
  status text not null default 'draft' check (status in ('draft','ready','active','paused','completed','archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (brand_id, workspace_id) references public.marketing_brands(id, workspace_id),
  foreign key (audience_segment_id, workspace_id) references public.marketing_audience_segments(id, workspace_id),
  foreign key (message_pillar_id, workspace_id) references public.marketing_message_pillars(id, workspace_id),
  foreign key (offer_id, workspace_id) references public.marketing_offers(id, workspace_id),
  foreign key (cta_id, workspace_id) references public.marketing_ctas(id, workspace_id)
);

create table if not exists public.marketing_campaign_hypotheses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid not null,
  hypothesis text not null,
  expected_signal text,
  decision_rule text,
  evidence_status text not null default 'hypothesis' check (evidence_status in ('hypothesis','research','observed','validated')),
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (campaign_id, workspace_id) references public.marketing_campaigns(id, workspace_id) on delete cascade
);

create table if not exists public.marketing_content_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null,
  campaign_id uuid,
  audience_segment_id uuid,
  message_pillar_id uuid,
  offer_id uuid,
  cta_id uuid,
  title text not null,
  content_type text not null check (content_type in ('short_video','long_video','image','carousel','post','article','email','ad')),
  funnel_stage text check (funnel_stage is null or funnel_stage in ('awareness','consideration','intent','conversion','retention')),
  primary_channel text,
  status text not null default 'draft' check (status in ('draft','generated','in_review','approved','ready','archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (brand_id, workspace_id) references public.marketing_brands(id, workspace_id),
  foreign key (campaign_id, workspace_id) references public.marketing_campaigns(id, workspace_id) on delete set null,
  foreign key (audience_segment_id, workspace_id) references public.marketing_audience_segments(id, workspace_id) on delete set null,
  foreign key (message_pillar_id, workspace_id) references public.marketing_message_pillars(id, workspace_id) on delete set null,
  foreign key (offer_id, workspace_id) references public.marketing_offers(id, workspace_id) on delete set null,
  foreign key (cta_id, workspace_id) references public.marketing_ctas(id, workspace_id) on delete set null
);

create table if not exists public.marketing_content_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_item_id uuid not null,
  version_number integer not null check (version_number > 0),
  hook text,
  body text,
  caption text,
  script jsonb,
  creative_brief jsonb,
  prompt_version text,
  model_provider text,
  model_name text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (content_item_id, version_number),
  unique (id, workspace_id),
  foreign key (content_item_id, workspace_id) references public.marketing_content_items(id, workspace_id) on delete cascade
);

create table if not exists public.marketing_ai_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_item_id uuid,
  job_type text not null check (job_type in ('text.generate','image.generate','compliance.check')),
  provider text not null,
  model_name text,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  idempotency_key text not null,
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  error_code text,
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (workspace_id, idempotency_key),
  unique (id, workspace_id),
  foreign key (content_item_id, workspace_id) references public.marketing_content_items(id, workspace_id) on delete cascade
);

create table if not exists public.marketing_content_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_item_id uuid not null,
  content_version_id uuid,
  generation_job_id uuid,
  asset_type text not null check (asset_type in ('image','thumbnail','carousel','video','audio','subtitle','document')),
  storage_bucket text not null default 'marketing-assets',
  storage_path text not null,
  mime_type text,
  width integer,
  height integer,
  duration_ms integer,
  provider text,
  provider_asset_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (content_item_id, workspace_id) references public.marketing_content_items(id, workspace_id) on delete cascade,
  foreign key (content_version_id, workspace_id) references public.marketing_content_versions(id, workspace_id) on delete set null,
  foreign key (generation_job_id, workspace_id) references public.marketing_ai_jobs(id, workspace_id) on delete set null
);

create index if not exists marketing_campaigns_ws_status_idx on public.marketing_campaigns(workspace_id, status);
create index if not exists marketing_content_ws_status_idx on public.marketing_content_items(workspace_id, status);
create index if not exists marketing_ai_jobs_ws_status_idx on public.marketing_ai_jobs(workspace_id, status);

commit;
