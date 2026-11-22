-- DEVELOPMENT ONLY. Apply only after backup, isolated restore and owner approval for Development DDL.
-- Never run on production. Registry is deliberately deny-by-default.
create schema if not exists migration_audit;
create table if not exists migration_audit.identity_mapping_registry (
 id uuid primary key default gen_random_uuid(),
 source_project_ref text not null check (source_project_ref = 'bjozpwdtqbpwcxnqguka'),
 source_user_id uuid not null,
 target_user_id uuid,
 evidence_ref text,
 evidence_sha256 text check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
 reviewed_by uuid,
 reviewed_at timestamptz,
 state text not null default 'pending' check (state in ('pending','verified','rejected','revoked')),
 created_at timestamptz not null default now(),
 unique(source_project_ref,source_user_id),
 check (state <> 'verified' or (target_user_id is not null and evidence_ref is not null and evidence_sha256 is not null and reviewed_by is not null and reviewed_at is not null))
);
create unique index if not exists identity_verified_target_unique on migration_audit.identity_mapping_registry(target_user_id) where state='verified';
create table if not exists migration_audit.workspace_mapping_registry (
 id uuid primary key default gen_random_uuid(),
 source_project_ref text not null check (source_project_ref = 'bjozpwdtqbpwcxnqguka'),
 source_workspace_id uuid not null,
 target_workspace_id uuid,
 source_owner_user_id uuid not null,
 target_owner_user_id uuid,
 owner_evidence_ref text,
 owner_evidence_sha256 text check (owner_evidence_sha256 ~ '^[0-9a-f]{64}$'),
 reviewed_by uuid,
 reviewed_at timestamptz,
 state text not null default 'pending' check (state in ('pending','verified','rejected','revoked')),
 created_at timestamptz not null default now(),
 unique(source_project_ref,source_workspace_id),
 check (state <> 'verified' or (target_workspace_id is not null and target_owner_user_id is not null and owner_evidence_ref is not null and owner_evidence_sha256 is not null and reviewed_by is not null and reviewed_at is not null))
);
create unique index if not exists workspace_verified_target_unique on migration_audit.workspace_mapping_registry(target_workspace_id) where state='verified';
alter table migration_audit.identity_mapping_registry enable row level security;
alter table migration_audit.workspace_mapping_registry enable row level security;
revoke all on schema migration_audit from public, anon, authenticated;
revoke all on all tables in schema migration_audit from public, anon, authenticated;
-- No public policies and no app-side service_role lookup. Dedicated audit role to be provisioned after least-privilege verification.
-- No implicit first-workspace selection. Application access requires exactly one verified owner-attested mapping.
