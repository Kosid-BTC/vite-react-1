-- CEO AI Marketing OS — Phase 1 Strategy
begin;

create table if not exists public.marketing_brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  website_url text,
  description text,
  positioning text,
  voice jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id)
);

create table if not exists public.marketing_audience_segments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null,
  code text not null,
  name text not null,
  description text,
  jobs_to_be_done jsonb not null default '[]'::jsonb,
  pains jsonb not null default '[]'::jsonb,
  anxieties jsonb not null default '[]'::jsonb,
  desired_outcomes jsonb not null default '[]'::jsonb,
  buying_triggers jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  search_intents jsonb not null default '[]'::jsonb,
  evidence_status text not null default 'hypothesis'
    check (evidence_status in ('hypothesis','research','observed','validated')),
  evidence jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, code),
  unique (id, workspace_id),
  foreign key (brand_id, workspace_id)
    references public.marketing_brands(id, workspace_id) on delete cascade
);

create table if not exists public.marketing_personas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null,
  audience_segment_id uuid,
  name text not null,
  summary text,
  business_stage text,
  awareness_stage text,
  evidence_status text not null default 'hypothesis'
    check (evidence_status in ('hypothesis','research','observed','validated')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (brand_id, workspace_id)
    references public.marketing_brands(id, workspace_id) on delete cascade,
  foreign key (audience_segment_id, workspace_id)
    references public.marketing_audience_segments(id, workspace_id) on delete set null
);

create table if not exists public.marketing_message_pillars (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null,
  code text not null,
  name text not null,
  problem text,
  promise text,
  proof text,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, code),
  unique (id, workspace_id),
  foreign key (brand_id, workspace_id)
    references public.marketing_brands(id, workspace_id) on delete cascade
);

create table if not exists public.marketing_offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null,
  code text not null,
  name text not null,
  description text,
  offer_type text,
  destination_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, code),
  unique (id, workspace_id),
  foreign key (brand_id, workspace_id)
    references public.marketing_brands(id, workspace_id) on delete cascade
);

create table if not exists public.marketing_ctas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null,
  code text not null,
  label text not null,
  action_type text not null,
  destination_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (brand_id, code),
  unique (id, workspace_id),
  foreign key (brand_id, workspace_id)
    references public.marketing_brands(id, workspace_id) on delete cascade
);

create table if not exists public.marketing_brand_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null,
  rule_type text not null,
  severity text not null default 'warning'
    check (severity in ('info','warning','blocking')),
  pattern text,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (brand_id, workspace_id)
    references public.marketing_brands(id, workspace_id) on delete cascade
);

commit;
