# CEO AI Thailand Marketing OS — Latest Development Audit

**Observed date:** 2026-11-26 (latest connector snapshot)  
**Scope:** GitHub exact-head CI, Supabase Development branch/catalog/security metadata, and authoritative Vercel deployment lookup.  
**Disposition:** Development-only. Cross-project application-data Read OFF. Production LOCKED. No database or deployment mutation.

## GitHub

- PR #24: OPEN / DRAFT / UNMERGED. Head `411284eaab0930b0c333a11703374c4543fe0302`, branch `feat/marketing-os-ceo-backoffice-intelligence-contract`, base `fix/marketing-os-release-gates-v5`. Mergeable=true is not acceptance.
- PR #23: OPEN / DRAFT / UNMERGED. Head `52c06743242ccc4dbf52f085acea02d1869c478a`, branch `fix/marketing-os-dual-db-security-gates`.
- PR #23 head → PR #24 head comparison: DIVERGED, 132 commits ahead / 7 behind; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- PR #24 exact-head workflows on `411284ea...` are all completed successfully:
  - Cross-project Read Guard run `45836332276` — PASS.
  - No-default-workspace Guard run `45836332700` — PASS.
  - Offline CEO Back Office Contract run `45836332321` — PASS.
- Cross-project Guard steps passed: dependency install, boundary guard, explicit own-property workspace validation, supplementary adapter fail-closed runtime test, Approved UX/UI V4 source contract, TypeScript typecheck, and offline placeholder-environment build.
- No-default-workspace Guard passed its source callsite detector.
- Offline Contract passed dual-owner/offline mapping checks, explicit-workspace regression, and static-only checks of the comment-only SQL proposals.
- These are source/static/offline/placeholder-build checks. They do NOT prove live owner attestation, live RLS behavior, Tenant A/B isolation, authenticated cross-project reads, or visual acceptance.
- PR #23 has previous Cross-project Read Guard run `45020906804` PASS. No new PR #23 run is asserted. Its combined status response contained no checks.

## Supabase Development branch discovery

Parent project refs were used only to list branches. The child Development refs below were the targets for catalog-only SQL reads.

| System | Development project ref | Branch ID | Parent project ref | Branch status | Preview DB | with_data |
|---|---|---|---|---|---|---|
| CEO Back Office | `tdeuyycqbbktacmxgktn` | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `waigsnxhrlwtiotspaim` | `FUNCTIONS_DEPLOYED` | `ACTIVE_HEALTHY` | false |
| Marketing OS | `roprejhnhoaqlctltwfs` | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `bjozpwdtqbpwcxnqguka` | `MIGRATIONS_FAILED` | `ACTIVE_HEALTHY` | false |

Migration ledgers:
- CEO Back Office: 77 records; latest version `20261116022248` (`dev_fixture_for_data_dependent_marketing_seed`).
- Marketing OS: 55 records; latest version `20261116022351` (`dev_restore_pg_cron_extension_for_behavior_maintenance`).
- The Marketing OS branch remains `MIGRATIONS_FAILED`; ledger presence does not mean recovery or replay succeeded.
- Direct `get_project` calls using child branch refs returned NotFound, while parent `list_branches` verified the child refs and Development statuses, and catalog-only SQL calls against those child refs succeeded. Treat branch listing as the status evidence.

## Supabase catalog-only security findings

The SQL connector session was `postgres` with `BYPASSRLS=true` on both branches. This session is not suitable for proving tenant isolation. No application rows were selected, no RPC was invoked, no secrets were accessed, and no DDL/DML was executed.

Common findings:
- `marketing_security` schema absent on both branches.
- `marketing_security.workspace_mapping_attestations` absent on both branches.
- `pg_net` extension and `net` schema present on both branches.
- No dedicated non-BYPASSRLS audit identity is ready.
- `anon` and `authenticated` SELECT privileges were false for the inspected tables; this does not prove every RPC, service-role, or alternate API path is safe.

CEO Back Office Development:
- RLS disabled: `profiles` (0 policies), `organizations` (1), `organization_members` (1), `standards` (0).
- `workspaces`: RLS enabled, 4 policies. `workspace_members`: RLS enabled, 2 policies.
- FORCE RLS is false on the inspected tables.
- `create_workspace(text)` is SECURITY DEFINER, owner postgres, executable by authenticated, and its current definition has an explicit `auth.uid() IS NULL` rejection.
- `ensure_default_workspace()` is SECURITY DEFINER, owner postgres, executable by authenticated. Its definition selects the earliest membership by `created_at` and calls `create_workspace('ส่วนตัว')` when none is found. Do not invoke it.

Marketing OS Development:
- Seven tables have RLS enabled with zero policies: `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, `youtube_quota`.
- `organizations`: RLS enabled, 2 policies. `workspaces`: RLS enabled, 3 policies. `workspace_members`: RLS enabled, 2 policies.
- FORCE RLS is false on the inspected tables.
- `create_workspace(text)` is SECURITY DEFINER, owner postgres, executable by authenticated, and its current definition lacks the explicit `auth.uid() IS NULL` rejection.
- `ensure_default_workspace()` has the same earliest-membership / personal-workspace fallback and is executable by authenticated. Do not invoke it.

Security Advisor snapshot (observed 2026-11-26 16:08 UTC):
- CEO Back Office: 2 policy-exists/RLS-disabled; 8 RLS-enabled/no-policy; 5 mutable search_path; 17 anon-executable SECURITY DEFINER; 34 authenticated-executable SECURITY DEFINER; 1 leaked-password-protection advisory.
- Marketing OS: 7 RLS-enabled/no-policy; 26 authenticated-executable SECURITY DEFINER.

Remediation references:
- [RLS disabled while policies exist](https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled)
- [RLS enabled with no policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- [Mutable function search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Anon-executable SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Authenticated-executable SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

One initial catalog aggregation query failed with SQLSTATE 42803 due to an invalid GROUP BY expression. It was corrected to a read-only JSON catalog query; the corrected query succeeded. No database state changed.

## Workspace Mapping and Read-only Adapter

- Owner-attestation registry is absent from both Development catalogs.
- The committed SQL files are explicitly comment-only, non-executable design templates; they are not migrations and were not applied.
- The supplementary adapter validates explicit workspace IDs, ignores portable target credentials, and returns `WORKSPACE_MAPPING_UNVERIFIED`; it makes no target Auth, network, or database call.
- Owner identity, dual independent consent, event authenticity, expiry, revocation, replay prevention, and per-read authorization remain UNVERIFIED.
- The static/offline CI contracts do not prove these runtime properties.

## Vercel authoritative project

- Project: `ceo-ai-marketing-os`
- Project ID: `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`
- Team ID: `team_oryw9VGF4TLakA4qBU6pGx43`
- SSO protection: enabled.
- Exact-SHA deployment lookups returned zero deployments for PR #24 head `411284ea...`, prior PR #24 code head `ff33dad...`, and PR #23 head `52c067432...`.
- The latest visible authoritative deployment is READY but uses old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, source `cli`, target `null`. It is not an authenticated PR Preview.
- GitHub combined Vercel status on PR #24 head is SUCCESS but links to legacy project `usrt-btc/ceoaimk`, not the authoritative project.
- No deployment, environment variable, secret, domain, or Production setting was changed.

## Acceptance gates

| Gate | Status |
|---|---|
| PR #24 exact-head source/static/offline/typecheck/placeholder build | PASS |
| PR #23 previous Cross-project Guard | PASS (previous evidence only) |
| Supabase Development branch discovery | PASS |
| Marketing OS migration recovery / backup / isolated restore / rollback | BLOCKED / UNVERIFIED |
| RLS / ACL / SECURITY DEFINER remediation | NOT APPLIED |
| Workspace Mapping owner verification / registry | UNVERIFIED |
| Dedicated non-BYPASSRLS audit identity | NOT READY |
| Authenticated Tenant A/B positive and negative tests | NOT RUN |
| Read-only Adapter live E2E | NOT RUN |
| Exact-SHA authoritative Vercel Preview | BLOCKED |
| Approved UX/UI V4 desktop 1536x1024 and mobile 390x844 visual comparison | UNVERIFIED |
| Cross-project application-data Read | OFF |
| Production | LOCKED |

**Disposition: KEEP PRs DRAFT / UNMERGED. NOT PRODUCTION COMPLETE.**
