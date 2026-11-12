-- REVIEW DRAFT ONLY: do not run against any Supabase project or Production.
-- Store under docs/architecture until a Supabase CLI-generated migration is approved.
-- Prerequisites: public.workspaces, public.workspace_members,
-- public.is_member(uuid), public.can_edit_workspace(uuid).
-- Test in an isolated local Postgres/Supabase instance with two workspaces first.

begin;

create table public.bei_evidence_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  dimension text not null check (dimension in (
    'identity_vrio', 'financial_resilience', 'product_market_fit',
    'growth_economics', 'adaptability_plc', 'operational_excellence'
  )),
  source text not null check (source in ('survey', 'financial_record', 'product_analytics', 'crm', 'qms', 'other')),
  evidence_level text not null check (evidence_level in ('self_reported', 'observed', 'verified')),
  reference text not null check (length(trim(reference)) between 1 and 120),
  description text not null check (length(trim(description)) between 1 and 500),
  consent_recorded boolean not null check (consent_recorded = true),
  captured_at timestamptz not null,
  recorded_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  unique (id, workspace_id, dimension)
);

create table public.bei_assessment_ratings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  dimension text not null check (dimension in (
    'identity_vrio', 'financial_resilience', 'product_market_fit',
    'growth_economics', 'adaptability_plc', 'operational_excellence'
  )),
  evidence_id uuid not null,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  rubric_version text not null check (rubric_version = '0.1.0'),
  recorded_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  constraint bei_rating_evidence_same_scope
    foreign key (evidence_id, workspace_id, dimension)
    references public.bei_evidence_records (id, workspace_id, dimension)
);

create index bei_evidence_workspace_time on public.bei_evidence_records(workspace_id, created_at desc);
create index bei_ratings_workspace_time on public.bei_assessment_ratings(workspace_id, created_at desc);

alter table public.bei_evidence_records enable row level security;
alter table public.bei_assessment_ratings enable row level security;
alter table public.bei_evidence_records force row level security;
alter table public.bei_assessment_ratings force row level security;

revoke all on public.bei_evidence_records from public, anon, authenticated;
revoke all on public.bei_assessment_ratings from public, anon, authenticated;
grant select, insert on public.bei_evidence_records to authenticated;
grant select, insert on public.bei_assessment_ratings to authenticated;

create policy bei_evidence_read on public.bei_evidence_records
  for select to authenticated using (public.is_member(workspace_id));
create policy bei_evidence_append on public.bei_evidence_records
  for insert to authenticated
  with check (public.can_edit_workspace(workspace_id)
    and recorded_by = (select auth.uid())
    and created_at between now() - interval '1 minute' and now() + interval '1 minute');

create policy bei_rating_read on public.bei_assessment_ratings
  for select to authenticated using (public.is_member(workspace_id));
create policy bei_rating_append on public.bei_assessment_ratings
  for insert to authenticated
  with check (public.can_edit_workspace(workspace_id)
    and recorded_by = (select auth.uid())
    and created_at between now() - interval '1 minute' and now() + interval '1 minute');

-- No UPDATE or DELETE grants/policies: append-only for authenticated users.
-- Privileged DB administrators and service-role bypass remain possible; audit guarantees
-- require external logging and access controls, not only these policies.
-- User-entered "verified" is a claim until an independent reviewer validates it.
-- No composite BES stored as a client-trusted field.

commit;
