-- DEVELOPMENT-ONLY PROPOSAL for CEO Back Office project waigsnxhrlwtiotspaim.
-- DO NOT APPLY TO PRODUCTION.
-- Apply only after a verified backup, PostgreSQL 17 isolated restore, schema parity,
-- and application/external-client callsite review. This file is not a migration.
-- It is intended for the CEO Back Office Development database only.
--
-- Evidence basis (read-only catalog audit, 2026-11-23 UTC):
-- public.ensure_default_workspace() is SECURITY DEFINER and executable by authenticated.
-- It selects the earliest membership and creates a Personal Workspace when none exists.
-- No database function source references it; the repository's no-default-workspace
-- source guard passes on the current PR head.
-- public.create_workspace(text) already contains an explicit auth.uid() NULL guard;
-- this proposal deliberately does not replace that function.
--
-- This proposal does not create a mapping, read another project, or enable cross-project access.

begin;

-- Remove API-role execution of implicit first-workspace selection.
revoke all on function public.ensure_default_workspace()
  from public, anon, authenticated, service_role, supabase_read_only_user;

commit;
