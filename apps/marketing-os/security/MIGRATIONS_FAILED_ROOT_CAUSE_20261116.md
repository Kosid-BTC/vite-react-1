# Migration failure root cause — evidence 2026-11-16

## Observed
Development branch `roprejhnhoaqlctltwfs` is `MIGRATIONS_FAILED`, data-free, and its migration history ends at `20260902132313` (37 versions) vs 47 on Production. The next Production version is `20260902132332_marketing_evidence_persistence`.

Read-only catalog checks confirmed these objects are absent in Development but present in Production:
- `public.marketing_brands` (defined in tracked `supabase/migrations/202608230102_marketing_os_strategy.sql`)
- `public.marketing_campaigns` and `public.marketing_content_items` (defined in tracked `supabase/migrations/202608230103_marketing_os_campaign_content.sql`)
- `public.can_edit_workspace(uuid)` (defined in tracked `supabase/migrations/202608230101_marketing_os_roles_helpers.sql`)
- `public.is_member(uuid)` (requires source/definition review)

`20260902132332` references all of the above via FKs and RLS policies. Hence its replay cannot succeed against the current Development schema. This is a **confirmed missing-dependency condition**, not a confirmed server-side error message; actual migration failure logs are not yet available.

## Critical inference
The branch records versions `202608230101`–`202608230107` as applied, despite missing schema objects defined by their GitHub SQL. Migration history alone is therefore not reliable evidence of actual schema state. Investigate whether these history rows had empty statements, whether a branch replay used a different migration source, or whether objects were subsequently removed. Avoid blindly marking versions applied or rerunning the entire migration set.

## Recovery path
1. Compare SHA/contents of the nine tracked migration SQL files against their corresponding current Production object definitions and dependencies. Do not assume filename match equals parity.
2. Obtain a schema-only, no-data baseline from Production using a client-side supported dump/CLI workflow, excluding secrets and runtime cron commands. Treat this as an auditable reconstruction source, not as migration history.
3. Rebuild a disposable, data-free test database from reviewed schema in dependency order. Do not run migrations that call Production URLs, cron jobs or Vault secrets.
4. Compare all functions and effective grants, tables, views, columns, constraints, indexes, RLS, policies, triggers, extension versions, role grants, dependency edges, and storage policies.
5. Gate security regression and rollback on exact parity. No Production changes until all gates pass.

## Current gate
Migration recovery PARTIAL; test schema parity FAIL; security regression NOT RUN; rollback NOT RUN. Production unchanged.
