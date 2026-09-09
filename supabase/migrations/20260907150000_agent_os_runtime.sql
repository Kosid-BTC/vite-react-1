-- CEO AI Thailand Agent-to-Agent Production OS runtime/audit layer
-- Non-production migration. Apply only after local/preview verification.

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  trace_id text not null,
  objective text not null,
  orchestrator_model text not null,
  fallback_model text,
  status text not null check (status in ('queued','running','completed','needs_human_approval','blocked','failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, trace_id)
);

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_key text not null,
  agent_name text not null,
  objective text not null,
  depends_on text[] not null default '{}',
  status text not null check (status in ('pending','ready','running','completed','blocked','failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (run_id, task_key)
);

create table if not exists public.agent_approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  task_id uuid references public.agent_tasks(id) on delete cascade,
  action text not null,
  reason text not null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  decided_by uuid references auth.users(id) on delete restrict,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid references public.agent_runs(id) on delete set null,
  task_id uuid references public.agent_tasks(id) on delete set null,
  actor_type text not null check (actor_type in ('user','agent','system','tool')),
  actor_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_eval_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  evaluator text not null,
  verdict text not null check (verdict in ('pass','fail','needs_review')),
  score numeric(5,4) check (score is null or (score >= 0 and score <= 1)),
  findings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_runs_workspace_created on public.agent_runs(workspace_id, created_at desc);
create index if not exists idx_agent_tasks_run_status on public.agent_tasks(run_id, status);
create index if not exists idx_agent_approvals_workspace_status on public.agent_approval_requests(workspace_id, status, created_at desc);
create index if not exists idx_agent_audit_workspace_created on public.agent_audit_events(workspace_id, created_at desc);
create index if not exists idx_agent_evals_run on public.agent_eval_runs(run_id, created_at desc);

alter table public.agent_runs enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_approval_requests enable row level security;
alter table public.agent_audit_events enable row level security;
alter table public.agent_eval_runs enable row level security;

-- Authenticated users receive read-only visibility inside their own workspaces.
-- Runtime mutation is intentionally reserved for trusted server-side/service-role code.
drop policy if exists agent_runs_select_member on public.agent_runs;
create policy agent_runs_select_member on public.agent_runs for select
  using (public.is_member(workspace_id));

drop policy if exists agent_tasks_select_member on public.agent_tasks;
create policy agent_tasks_select_member on public.agent_tasks for select
  using (public.is_member(workspace_id));

drop policy if exists agent_approvals_select_member on public.agent_approval_requests;
create policy agent_approvals_select_member on public.agent_approval_requests for select
  using (public.is_member(workspace_id));

drop policy if exists agent_audit_select_member on public.agent_audit_events;
create policy agent_audit_select_member on public.agent_audit_events for select
  using (public.is_member(workspace_id));

drop policy if exists agent_evals_select_member on public.agent_eval_runs;
create policy agent_evals_select_member on public.agent_eval_runs for select
  using (public.is_member(workspace_id));

comment on table public.agent_runs is 'Agent OS top-level execution trace. Authenticated clients are read-only; server runtime writes via trusted service role.';
comment on table public.agent_approval_requests is 'Human approval gate evidence. No authenticated direct-write policy by design.';
comment on table public.agent_audit_events is 'Append-only runtime evidence from trusted server-side execution.';
