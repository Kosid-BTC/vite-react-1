-- CEO AI Thailand — P1.2 Trusted Evidence Persistence Boundary
-- Branch/local-disposable verification only. Do not apply to production from this workflow.

begin;

create table if not exists public.marketing_evidence (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  business_id uuid not null,
  campaign_id uuid,
  content_item_id uuid,
  evidence_kind text not null check (evidence_kind in ('metric','outcome','observation','experiment')),
  outcome_key text not null,
  truth_status text not null check (truth_status in ('MEASURED','DERIVED','ASSUMED','PLACEHOLDER','UNAVAILABLE')),
  value jsonb not null default '{}'::jsonb,
  provenance jsonb not null,
  idempotency_key text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (workspace_id, idempotency_key),
  foreign key (business_id, workspace_id)
    references public.marketing_brands(id, workspace_id) on delete cascade,
  foreign key (campaign_id, workspace_id)
    references public.marketing_campaigns(id, workspace_id) on delete set null,
  foreign key (content_item_id, workspace_id)
    references public.marketing_content_items(id, workspace_id) on delete set null,
  constraint marketing_evidence_provenance_object
    check (jsonb_typeof(provenance) = 'object' and provenance <> '{}'::jsonb),
  constraint marketing_evidence_value_object
    check (jsonb_typeof(value) = 'object')
);

create index if not exists marketing_evidence_workspace_created_idx
  on public.marketing_evidence(workspace_id, created_at desc);
create index if not exists marketing_evidence_business_outcome_idx
  on public.marketing_evidence(business_id, outcome_key);

alter table public.marketing_evidence enable row level security;

drop policy if exists marketing_evidence_select on public.marketing_evidence;
create policy marketing_evidence_select on public.marketing_evidence
for select to authenticated
using (public.is_member(workspace_id));

drop policy if exists marketing_evidence_insert on public.marketing_evidence;
create policy marketing_evidence_insert on public.marketing_evidence
for insert to authenticated
with check (
  public.can_edit_workspace(workspace_id)
  and created_by = auth.uid()
);

drop policy if exists marketing_evidence_update on public.marketing_evidence;
create policy marketing_evidence_update on public.marketing_evidence
for update to authenticated
using (public.can_edit_workspace(workspace_id))
with check (
  public.can_edit_workspace(workspace_id)
  and created_by = auth.uid()
);

drop policy if exists marketing_evidence_delete on public.marketing_evidence;
create policy marketing_evidence_delete on public.marketing_evidence
for delete to authenticated
using (public.can_edit_workspace(workspace_id));

commit;
