# PDCA Refresh — 2026-11-27 09:07 ICT

## Scope and safety
- Continue PR #24 / PR #23 integration work for CEO Back Office → Marketing Intelligence → Marketing Execution.
- Development-only catalog and source inspection.
- No application rows read; no SQL DDL/DML, migration, Auth/RLS/ACL mutation, branch reset/rebase/merge, deployment, or Production change.
- Cross-project application-data Read remains OFF. Production remains LOCKED.

## GitHub exact references
- PR #24: OPEN / DRAFT / UNMERGED.
- Audited PR #24 code/documentation head before this audit commit: `4a8b7e9d53b0e70f307a31e76a2f861c78e3348d`.
- PR #23: OPEN / DRAFT / UNMERGED; head `52c06743242ccc4dbf52f085acea02d1869c478a`.
- Exact commit comparison PR #23 head → PR #24 head: DIVERGED; PR #24 ahead 144 / behind 7; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- The audited PR #24 head commit changes only `apps/marketing-os/docs/PDCA_REFRESH_2026-11-27_0833ICT.md`.
- PR #24 metadata body still contains older head references; current API head above is authoritative for this run.

## Exact-head CI evidence
All three PR-triggered workflows were completed successfully on exact head `4a8b7e9d53b0e70f307a31e76a2f861c78e3348d`:
- Cross-project Read Guard: run `45923724791`, conclusion SUCCESS.
- No-default-workspace Guard: run `45923724803`, conclusion SUCCESS.
- Offline CEO Back Office Contract: run `45923724786`, conclusion SUCCESS.
- Job and step summaries were fetched; all listed steps completed successfully.
- These are source/static/offline/typecheck/build checks only. They do not establish authenticated owner consent, live database integration, Tenant A/B isolation, or Production acceptance.
- GitHub combined Vercel status is SUCCESS but its target points to legacy project `usrt-btc/ceoaimk`, not the authoritative Vercel project.

## Supabase Development branch identity
- Marketing OS Development: project ref `roprejhnhoaqlctltwfs`, branch ID `e2139d78-2675-4863-ac64-a5fad7c8f826`, branch `dev-marketing-mapping-attestation`, status `MIGRATIONS_FAILED`, preview database `ACTIVE_HEALTHY`, `with_data=false`, migration ledger count 55.
- CEO Back Office Development: project ref `tdeuyycqbbktacmxgktn`, branch ID `2172c0d4-e534-4fe8-918e-5c99ad35ae45`, branch `dev-backoffice-rls-hardening`, status `FUNCTIONS_DEPLOYED`, preview database `ACTIVE_HEALTHY`, `with_data=false`, migration ledger count 77.
- Catalog-only SQL executed against those Development branch refs. The SQL session user is `postgres`; this is a privileged catalog audit, not a least-privilege tenant test.

## Fresh Development catalog findings
### Marketing OS Development (`roprejhnhoaqlctltwfs`)
- Public tables: 44.
- Effective TRUNCATE: anon 36 tables; authenticated 36 tables.
- RLS enabled with no policy: 7 tables.
- RLS disabled while policies exist: 0 tables.
- SECURITY DEFINER functions: 42 total; anon EXECUTE 0; authenticated EXECUTE 26.
- `public.ensure_default_workspace()`: owner `postgres`, SECURITY DEFINER, anon EXECUTE false, authenticated EXECUTE true.
- Its current function definition selects the earliest workspace membership ordered by `created_at`, and creates a personal workspace when none exists. Do not invoke it.
- `marketing_security.workspace_mapping_attestations`: absent.

### CEO Back Office Development (`tdeuyycqbbktacmxgktn`)
- Public tables: 66.
- Effective TRUNCATE: anon 31 tables; authenticated 62 tables.
- RLS enabled with no policy: 8 tables.
- RLS disabled while policies exist: 2 tables (`organizations`, `organization_members`).
- SECURITY DEFINER functions: 36 total; anon EXECUTE 17; authenticated EXECUTE 34.
- `public.ensure_default_workspace()`: owner `postgres`, SECURITY DEFINER, anon EXECUTE false, authenticated EXECUTE true.
- Its current function definition selects the earliest workspace membership ordered by `created_at`, and creates a personal workspace when none exists. Do not invoke it.
- `marketing_security.workspace_mapping_attestations`: absent.

### Role and default ACL findings
- `anon` and `authenticated`: BYPASSRLS=false.
- `postgres`, `service_role`, and `supabase_read_only_user`: BYPASSRLS=true.
- Public-schema default ACL owned by `supabase_admin` grants anon and authenticated broad default privileges for future tables, including INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, and MAINTAIN; sequences include SELECT/UPDATE/USAGE; functions include EXECUTE.
- Effective table privilege counts and default ACL findings are Development-only. They are not proof of an exploited path, but require object/role/grantor/dependency review before remediation.
- No REVOKE, GRANT, ALTER, or other mutation was performed.

## Fresh Security Advisor findings
- Marketing OS Development: 7 RLS-enabled/no-policy findings and 26 authenticated-executable SECURITY DEFINER findings.
- CEO Back Office Development: 2 policy-exists/RLS-disabled errors; 8 RLS-enabled/no-policy findings; 5 mutable search_path warnings; 17 anon-executable SECURITY DEFINER findings; 34 authenticated-executable SECURITY DEFINER findings; leaked-password protection disabled.
- Remediation references:
  - https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled
  - https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
  - https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
  - https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
  - https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
  - https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Source review — fail-closed behavior
- `src/lib/supabase/supplementary-readonly.ts` is server-only; validates explicit workspace IDs, ignores client-supplied target access tokens, performs no target Auth/network/database call, and returns `WORKSPACE_MAPPING_UNVERIFIED`.
- `src/lib/supabase/supplementary-boundary.ts` remains disabled with `IDENTITY_MAPPING_UNVERIFIED`.
- `ceo-backoffice-contract.ts` performs pure input/shape/time validation. It explicitly states that SHA-256 digests and client-supplied envelopes do not prove independent owner identity or consent.
- Mapping registry SQL and RPC hardening SQL files are comment-only, non-executable proposals. Neither was applied.
- No default/first workspace fallback was invoked. Explicit workspace IDs remain required.

## Vercel
- Authoritative project: `ceo-ai-marketing-os`, ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`, team `team_oryw9VGF4TLakA4qBU6pGx43`.
- Exact-SHA deployment lookup for PR #24 head `4a8b7e9d53b0e70f307a31e76a2f861c78e3348d`: zero deployments found.
- GitHub's Vercel status is SUCCESS but points to legacy `usrt-btc/ceoaimk`; it is not authoritative Preview evidence.
- Latest visible authoritative non-production deployment returned by project history is READY but has target null and old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- Latest Production-target deployment returned by Vercel history: ID `dpl_7WSDaycLq8vhWy8JbnFLy3rzzSvj`, state READY, SHA `536d928ca6ad94a3fcb2d388f6cd83350d634fed`. This metadata does not prove current authenticated runtime or UX/UI acceptance.
- Project SSO protection is enabled for deployments except custom domains; password protection is disabled.
- No deployment was initiated.

## Acceptance disposition
- Exact-head CI: PASS 3/3 (static/offline scope only).
- Owner-attested mapping / independent Auth verification: UNVERIFIED.
- Mapping registry runtime: NOT PRESENT.
- RLS/RPC security remediation: FAIL / BLOCKED.
- Dedicated non-BYPASSRLS audit identity: UNVERIFIED.
- Tenant A/B authenticated integration: UNVERIFIED.
- Live read-only adapter E2E: UNVERIFIED; adapter remains disabled.
- Authoritative exact-SHA Preview: FAIL (zero deployment).
- Authenticated UX/UI V4 desktop 1536x1024 and mobile 390x844: UNVERIFIED.
- Production Acceptance: NOT PASSED.

## Next 3 steps
1. Recovery first: attest backup integrity, PostgreSQL 17 isolated restore, migration semantic parity, dependency/collision matrix, and rollback proof for Marketing OS Development.
2. Security remediation plan: object-by-object ACL/default-ACL and Effective TRUNCATE/MAINTAIN review; then least-privilege role, RLS/policy, SECURITY DEFINER/search_path, and no-first-workspace RPC hardening in Development only after recovery preconditions pass.
3. Owner and integration acceptance: independently verify both owners in their own Auth contexts, implement a protected mapping registry only after recovery, run non-BYPASSRLS Tenant A/B positive/negative tests, then exact-SHA authoritative Preview and approved UX/UI V4 desktop/mobile evidence.

**Disposition: KEEP PR #24 / PR #23 DRAFT. Cross-project application-data Read OFF. Production LOCKED. NOT PRODUCTION COMPLETE.**
