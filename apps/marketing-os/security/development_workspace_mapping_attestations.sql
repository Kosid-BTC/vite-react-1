-- DEVELOPMENT-ONLY PROPOSAL. DO NOT APPLY TO PRODUCTION.
-- Owner evidence is independently verified in each project's Auth context by a trusted server.
-- Never infer a mapping from workspace names, emails or row order.
begin;
create schema if not exists marketing_security;
revoke all on schema marketing_security from public, anon, authenticated;
create table if not exists marketing_security.workspace_mapping_attestations (
  mapping_id uuid primary key default gen_random_uuid(),
  primary_project_ref text not null check (primary_project_ref = 'bjozpwdtqbpwcxnqguka'),
  supplementary_project_ref text not null check (supplementary_project_ref = 'waigsnxhrlwtiotspaim'),
  primary_workspace_id uuid not null,
  supplementary_workspace_id uuid not null,
  primary_owner_user_id uuid not null,
  supplementary_owner_user_id uuid not null,
  primary_consent_event_id text not null check (length(trim(primary_consent_event_id)) > 0),
  supplementary_consent_event_id text not null check (length(trim(supplementary_consent_event_id)) > 0),
  primary_verified_at timestamptz not null,
  supplementary_verified_at timestamptz not null,
  reviewed_by text not null check (length(trim(reviewed_by)) > 0),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  check (expires_at > greatest(primary_verified_at, supplementary_verified_at)),
  check (primary_verified_at <= created_at and supplementary_verified_at <= created_at),
  check (revoked_at is null or revocation_reason is not null),
  unique(primary_workspace_id, supplementary_workspace_id)
);
create unique index if not exists workspace_mapping_primary_unique
  on marketing_security.workspace_mapping_attestations(primary_workspace_id);
create unique index if not exists workspace_mapping_supplementary_unique
  on marketing_security.workspace_mapping_attestations(supplementary_workspace_id);
alter table marketing_security.workspace_mapping_attestations enable row level security;
alter table marketing_security.workspace_mapping_attestations force row level security;
revoke all on marketing_security.workspace_mapping_attestations from public, anon, authenticated;
-- No authenticated/anon policies or EXECUTE grants. Default deny.
-- Do not enable any cross-project adapter based solely on rows in this table.
-- A trusted backend must verify BOTH authenticated owner consent events independently,
-- reject forged/expired/revoked evidence, and re-check status on EVERY read.
-- Do not store access tokens, JWTs, API keys, or customer records here.
commit;
