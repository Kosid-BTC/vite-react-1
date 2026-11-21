# Schema-only reconstruction — controlled execution plan

## Current blockers
Existing data-free branch `roprejhnhoaqlctltwfs` has MIGRATIONS_FAILED and lacks 27 public tables/views, 13 functions, 72 RLS policies, and 1 user trigger. Production schema cannot be certified by migration history alone.

## Safe reconstruction (operator / CI runner with Docker, Supabase CLI and temporary database credentials)
1. Verify `supabase --version`, `supabase db dump --help`, `supabase start --help`, and `supabase db reset --help`. Use the official CLI docs: https://supabase.com/docs/reference/cli/supabase-db-dump
2. In a secured runner, link READ-ONLY access to Production or use an ephemeral database URL via secret manager. Run **schema-only** `supabase db dump --db-url "$PROD_DB_URL" --schema public -f /tmp/marketing-production-schema.sql` (verify flags with installed CLI). Never use `--data-only`, `--role-only`, `--include-all`, or copy customer records.
3. Restrict permissions on temporary dump, scan for JWTs, URLs, Vault references, `cron.schedule`, `net.http_*`, `http_*`, `COPY`, `dblink`, and secret literals. **Stop** if any executable network/secret-bearing statement remains. Do not publish raw dump to GitHub.
4. Provision a new isolated local Supabase/Postgres stack with outbound network disabled and synthetic auth fixtures. Restore reviewed schema using a client-side `psql -v ON_ERROR_STOP=1 -X -1 -f ...` against the isolated target only. Ensure required Supabase managed roles/extensions exist; the default CLI dump excludes managed schemas.
5. Never restore Production cron jobs or Vault secret values. To obtain *exact* parity, record that deliberately disabled external-service objects are controlled exceptions and do not claim full parity until their safe structural equivalents are attested.
6. Collect read-only `PARITY_INVENTORY_READONLY.sql` on both targets; compare object identities, function definition MD5, owner/search_path, effective grants, RLS policies, triggers, views and extensions. Extend coverage to columns, indexes, constraints, default privileges, role memberships, storage policies, dependency edges and cron metadata.
7. Require **47 public functions, 42 SECURITY DEFINER, 44 tables, 2 views, 96 policies, 8 user triggers**, and identical fingerprints and grants (not just counts). Any discrepancy => FAIL CLOSED.
8. Only after exact parity or formally approved isolated-service exceptions, run Security Regression and test Rollback on isolated target. Production stays unchanged.

## Known credential incident
Production migration `20261114080605` includes a literal JWT in a scheduled job. A sanitized copy is in `security/quarantine`. Do not dump or log its raw value. Determine JWT scope and validity through authorized secure operations, plan controlled replacement and consider rotating if active. Do not alter Production cron/auth without approved impact plan.

## Branch/cost
Existing branch is not usable for parity. No new paid branch should be created until verified restore procedure and explicit charge boundary. Existing branch may be incurring charges; investigate with project owner.

## Status
PLAN PREPARED, RESTORE NOT EXECUTED, PARITY FAIL, REGRESSION NOT RUN, ROLLBACK NOT RUN.
