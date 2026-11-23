# Development Migration Recovery Evidence

**Scope:** Development branch only. This document records read-only observations and historical PostgreSQL log evidence. It is not a migration, repair instruction, or authorization to apply DDL.

**Safety invariants**
- Keep cross-project application-data reads disabled.
- Do not call `public.ensure_default_workspace()`.
- Do not reset, rebase, merge, or apply migrations to either branch until backup attestation, PostgreSQL 17 isolated restore, schema parity, and rollback evidence are accepted.
- Do not change Production.
- Treat catalog and log output as evidence only; do not infer owner consent from workspace names, slugs, email addresses, or matching user IDs.

## 1. Current Development branch identity

| System | Parent project | Development project ref | Branch | Current branch status | With data |
|---|---|---|---|---|---|
| CEO Back Office | `waigsnxhrlwtiotspaim` | `tdeuyycqbbktacmxgktn` | `dev-backoffice-rls-hardening` | `FUNCTIONS_DEPLOYED` | false |
| Marketing OS | `bjozpwdtqbpwcxnqguka` | `roprejhnhoaqlctltwfs` | `dev-marketing-mapping-attestation` | `MIGRATIONS_FAILED` | false |

The Marketing OS branch remains `MIGRATIONS_FAILED` despite several recovery migrations being recorded. A migration inventory is not proof that every migration or the branch replay completed successfully.

Latest listed Marketing OS migration versions observed:
- `20261116022351` — `dev_restore_pg_cron_extension_for_behavior_maintenance`
- `20261116022142` — `dev_recover_marketing_os_rls_without_destructive_replacements`
- `20261116022118` — `dev_recover_202608230107_workspace_slug`
- `20261116022116` — `dev_recover_202608230106_marketing_os_storage_seed`
- `20261116021717` — `dev_recover_202608230104_marketing_os_approval_tracking`

## 2. Historical Marketing OS PostgreSQL errors

Read-only log query against Development project `roprejhnhoaqlctltwfs`, UTC window 2026-11-16 01:40–02:45:

| UTC timestamp | SQLSTATE | Observed error | Statement context |
|---|---|---|---|
| 2026-11-16 01:56:28.911 | `42P01` | `relation "public.workspaces" does not exist` | Creating `public.marketing_evidence` with a foreign key to `public.workspaces(id)` before that relation existed at that moment |
| 2026-11-16 02:22:23.153 | `3F000` | `schema "cron" does not exist` | Calling `cron.schedule('marketing-behavior-maintenance', ...)` before the cron schema was available |
| 2026-11-16 02:24:29.579 | `P0002` | `query returned no rows` | Seed block used `SELECT INTO STRICT` for workspace slug `ceo-ai-thailand` and brand `CEO AI Thailand` |

These records establish failed SQL attempts and their immediate prerequisites. They do **not** identify the exact source migration file/version responsible for every attempt, nor prove the current seed rows exist.

Current catalog checks on the Marketing OS Development branch confirm that the following relations now exist:
- `public.workspaces`
- `public.marketing_brands`
- `public.marketing_audience_segments`
- `public.marketing_business_types`
- `cron.job`

Relation existence does not prove that the expected workspace/brand seed rows exist or that migration replay is healthy. The branch status remains `MIGRATIONS_FAILED`.

## 3. Audit-query errors that must not be classified as application migration failures

Separate 2026-11-23 audit activity generated:
- SQLSTATE `42601` syntax errors from a malformed metadata-only audit query.
- SQLSTATE `42P01` for `public.marketing_business_types` when an audit query attempted to inspect that Marketing OS-specific relation on the CEO Back Office Development database. The relation is present on Marketing OS Development and absent on CEO Back Office Development; this is a cross-schema audit-scope mismatch, not evidence of a Marketing OS migration failure.

Do not use these audit-query errors as product incident or migration root-cause evidence.

## 4. Workspace and RLS security observations

On both Development branches, catalog inspection observed:
- `public.ensure_default_workspace()` is `SECURITY DEFINER`, owned by `postgres`, and executable by `authenticated`.
- Its body selects the earliest `workspace_members` row ordered by `created_at`; when none exists it calls `public.create_workspace('ส่วนตัว')`.
- The function has `search_path = public`; this does not remove the implicit-first-workspace behavior.
- `workspaces` and `workspace_members` have RLS enabled but `FORCE ROW LEVEL SECURITY` is false.
- CEO Back Office policy counts: 4 on `workspaces`, 2 on `workspace_members`.
- Marketing OS policy counts: 3 on `workspaces`, 2 on `workspace_members`.
- `marketing_security.workspace_mapping_attestations` is absent on both Development branches.

Role catalog observations:
- `anon` and `authenticated`: `BYPASSRLS=false`.
- `postgres`, `service_role`, and `supabase_read_only_user`: `BYPASSRLS=true`.

The SQL connector session is privileged; it is not a valid Tenant A/B audit identity. A dedicated non-`BYPASSRLS` test identity and authenticated test contexts are still required.

## 5. Security Advisor snapshot

Observed on 2026-11-23 around 16:04 UTC:

| Finding | CEO Back Office Development | Marketing OS Development |
|---|---:|---:|
| Policies exist while RLS is disabled | 2 | 0 |
| RLS enabled without policies | 8 | 7 |
| Mutable function search_path | 5 | 0 |
| Anon-executable SECURITY DEFINER functions | 17 | 0 |
| Authenticated-executable SECURITY DEFINER functions | 34 | 26 |

These are advisor counts, not proof that every finding is exploitable. Review each function's authorization logic and each table's intended access contract before changing grants or policies.

## 6. Credential-handling note

A historical cron-scheduling SQL log line contains an Authorization bearer JWT whose decoded role is `anon`; the token value is intentionally omitted here. The same statement references a Vault secret by name but the selected log evidence does not include the Vault secret value. This is not evidence of a leaked `service_role` key. Avoid embedding credentials in SQL text that is logged; verify the job's current credential source and keep privileged maintenance credentials in Vault/server-side execution.

## 7. Required recovery sequence

1. Obtain and attest a recoverable backup for each Development project.
2. Restore each backup into an isolated PostgreSQL 17 target and verify schema, extensions, migration history, and rollback.
3. Map each historical error to its exact migration/source file and dependency order; resolve relation, extension, and seed prerequisites in an isolated copy first.
4. Reconcile the migration ledger with actual schema state; do not mark a migration applied merely to bypass an error.
5. Only after recovery acceptance, create a dedicated non-`BYPASSRLS` audit identity and perform authenticated Tenant A/B negative and positive tests.
6. Independently verify both owners' consent events before implementing or enabling the mapping registry.
7. Keep the supplementary adapter fail-closed until owner attestation, RLS/RPC authorization, and per-read authorization are accepted.

## 8. Current acceptance state

- Source/static CI: may pass independently; it does not certify database integration.
- Marketing OS Development migration state: **FAIL / MIGRATIONS_FAILED**.
- Owner-attestation registry: **NOT IMPLEMENTED**.
- Default-workspace RPC removal/replacement: **NOT IMPLEMENTED**.
- Dedicated non-`BYPASSRLS` audit identity: **NOT READY**.
- Tenant A/B integration: **NOT RUN**.
- Cross-project application read: **OFF**.
- Production mutation: **LOCKED**.
- Production acceptance: **NOT COMPLETE**.
