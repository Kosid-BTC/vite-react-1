-- CEO AI Marketing OS — Phase 1 Approval + Tracking
begin;

create table if not exists public.marketing_compliance_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_item_id uuid not null,
  brand_rule_id uuid,
  severity text not null check (severity in ('info','warning','blocking')),
  finding text not null,
  suggested_fix text,
  resolved boolean not null default false,
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (content_item_id, workspace_id) references public.marketing_content_items(id, workspace_id) on delete cascade,
  foreign key (brand_rule_id, workspace_id) references public.marketing_brand_rules(id, workspace_id) on delete set null
);

create table if not exists public.marketing_approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_item_id uuid not null,
  content_version_id uuid,
  status text not null default 'pending' check (status in ('pending','approved','rejected','changes_requested')),
  requested_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  review_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (id, workspace_id),
  foreign key (content_item_id, workspace_id) references public.marketing_content_items(id, workspace_id) on delete cascade,
  foreign key (content_version_id, workspace_id) references public.marketing_content_versions(id, workspace_id) on delete set null
);

create table if not exists public.marketing_tracking_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid,
  content_item_id uuid,
  destination_url text not null,
  short_code text,
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  utm_content text,
  utm_term text,
  segment_code text not null,
  final_url text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (campaign_id, workspace_id) references public.marketing_campaigns(id, workspace_id) on delete cascade,
  foreign key (content_item_id, workspace_id) references public.marketing_content_items(id, workspace_id) on delete cascade
);

create table if not exists public.marketing_action_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  action_type text not null,
  title text not null,
  description text,
  priority integer not null default 0,
  entity_type text,
  entity_id uuid,
  action_href text,
  status text not null default 'open' check (status in ('open','done','dismissed')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, workspace_id)
);

create or replace function public.marketing_content_ready(p_content uuid, p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.marketing_approval_requests a
      where a.workspace_id = p_workspace
        and a.content_item_id = p_content
        and a.status = 'approved'
    )
    and not exists (
      select 1 from public.marketing_compliance_findings f
      where f.workspace_id = p_workspace
        and f.content_item_id = p_content
        and f.severity = 'blocking'
        and f.resolved = false
    )
    and exists (
      select 1 from public.marketing_tracking_links t
      where t.workspace_id = p_workspace
        and t.content_item_id = p_content
    );
$$;

revoke all on function public.marketing_content_ready(uuid, uuid) from public;
grant execute on function public.marketing_content_ready(uuid, uuid) to authenticated;

commit;
