# PDCA refresh — CEO AI Thailand Marketing OS — 2026-11-27 01:06 ICT

**Disposition:** Development-only audit evidence. No Production mutation, no SQL/DDL/DML, no Cross-project application-data Read. Keep PR #24 and PR #23 Draft. Production remains LOCKED.

## Exact Git refs

- PR #24: OPEN / DRAFT / UNMERGED; head `72b66c37ccf80c86e27df079b6357801fb442556`; branch `feat/marketing-os-ceo-backoffice-intelligence-contract`.
- PR #23: OPEN / DRAFT / UNMERGED; head `52c06743242ccc4dbf52f085acea02d1869c478a`; branch `fix/marketing-os-dual-db-security-gates`.
- PR #23 → PR #24: DIVERGED, PR #24 ahead 134 / behind 7; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- No merge was attempted.

## Exact-head CI evidence — PR #24

All three PR workflows on head `72b66c37ccf80c86e27df079b6357801fb442556` completed successfully:

- Cross-project Read Guard run `45869999849`: PASS — checkout, locked dependency install, boundary guard, explicit workspace own-property validation, supplementary adapter fail-closed, approved UI source contract, typecheck, and offline placeholder build.
- No-default-workspace Guard run `45869999692`: PASS — rejects implicit first-workspace RPC callsites.
- Offline CEO Back Office Contract run `45869999708`: PASS — dual-owner/offline evidence, explicit workspace fail-closed regression, static owner-attestation SQL proposal, and static workspace-RPC hardening proposal checks.

These are source/static/offline/typecheck/build checks only. They do not prove live Owner Verification, RLS under a non-BYPASSRLS identity, Tenant A/B, runtime E2E, or authenticated visual acceptance.

PR #23 has prior Cross-project Read Guard run `45020906804` PASS on head `52c06743242ccc4dbf52f085acea02d1869c478a`; it is previous evidence, not a new run.

## Vercel

- Authoritative project: `ceo-ai-marketing-os`, project ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`, team `team_oryw9VGF4TLakA4qBU6pGx43`.
- Exact-SHA deployment query for PR #24 head `72b66c37...`: **0 deployments**.
- GitHub combined Vercel status is `success`, but the target is legacy project `usrt-btc/ceoaimk`; it is not authoritative-project Preview evidence.
- Latest visible authoritative deployment is READY, target null, on older SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- Authenticated Preview and Desktop/Mobile visual acceptance remain UNVERIFIED.

## Supabase Development branch status

Branch listing from parent projects confirms:

- Marketing OS Development: ref `roprejhnhoaqlctltwfs`, branch ID `e2139d78-2675-4863-ac64-a5fad7c8f826`, branch `dev-marketing-mapping-attestation`, status `MIGRATIONS_FAILED`, `with_data=false`, Preview DB `ACTIVE_HEALTHY`.
- CEO Back Office Development: ref `tdeuyycqbbktacmxgktn`, branch ID `2172c0d4-e534-4fe8-918e-5c99ad35ae45`, branch `dev-backoffice-rls-hardening`, status `FUNCTIONS_DEPLOYED`, `with_data=false`, Preview DB `ACTIVE_HEALTHY`.

Catalog-only queries used the Development refs. No application rows were queried and no SQL/DDL/DML was applied.

## Current catalog findings

Marketing OS Development:
- 7 selected tables have RLS enabled with zero policies: `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, `youtube_quota`.
- Selected `organizations`, `workspace_members`, and `workspaces` have RLS enabled with 2, 2, and 3 policies respectively.
- SELECT privilege checks for `anon` and `authenticated` were false on all selected tables; FORCE RLS was false. This does not certify other RPC/API paths.

CEO Back Office Development:
- `profiles`, `organizations`, `organization_members`, and `standards` have RLS disabled; policy counts are 0, 1, 1, and 0 respectively.
- `workspace_members` and `workspaces` have RLS enabled with 2 and 4 policies.
- SELECT privilege checks for `anon` and `authenticated` were false on selected tables; FORCE RLS was false.

Security Advisor snapshot (observed 2026-11-26 18:06 UTC):
- Marketing OS: 7 RLS-enabled/no-policy findings and 26 authenticated-executable SECURITY DEFINER findings.
- Back Office: 2 policy/RLS-disabled findings, 8 RLS-enabled/no-policy, 5 mutable search_path, 17 anon-executable SECURITY DEFINER, 34 authenticated-executable SECURITY DEFINER.

## Workspace RPC / Mapping

- `public.ensure_default_workspace()` remains SECURITY DEFINER, owner `postgres`, EXECUTE granted to `authenticated` on both Development databases. It selects the earliest membership and creates a personal workspace if none exists. **Do not invoke.**
- Marketing OS `create_workspace(text)` lacks an explicit `auth.uid() IS NULL` guard; Back Office has one. Both are SECURITY DEFINER and executable by authenticated; anon EXECUTE is false.
- `marketing_security.workspace_mapping_attestations` is absent from both Development catalogs.
- Roles `anon` and `authenticated` have BYPASSRLS=false; `postgres`, `service_role`, and `supabase_read_only_user` have BYPASSRLS=true. SQL connector identity is `postgres`; this is not suitable for Tenant A/B acceptance.
- Trusted Owner Verification, expiry/revocation, replay prevention, and independent dual-owner consent remain UNVERIFIED.

## Recovery / risks

- Marketing OS branch status remains `MIGRATIONS_FAILED`; historical relation-order, cron-schema, and seed-lookup errors remain documented. Backup attestation, PostgreSQL 17 isolated restore, migration parity, and rollback evidence are not available in this audit.
- RLS/RPC/ACL remediation is not applied.
- Read-only adapter remains fail-closed at source/offline-test level; no live cross-project call is made.

## Next three gates

1. Recovery First: backup attestation, isolated PostgreSQL 17 restore, schema/migration parity, collision resolution, and rollback evidence.
2. Development-only security remediation after Recovery: table-specific RLS/ACL, SECURITY DEFINER grant review, no-default-workspace RPC removal from API surface, explicit auth guard, and owner-attestation registry.
3. Integration acceptance: trusted dual-owner verification, non-BYPASSRLS Tenant A/B positive/negative tests, read-only adapter E2E, exact-SHA authoritative Preview, and approved UX/UI V4 screenshots at 1536x1024 and 390x844.

**Status: NOT PRODUCTION COMPLETE. Cross-project application-data Read remains OFF. Production remains LOCKED.**


## Additional fresh Development ACL privilege snapshot — 2026-11-27 01:06 ICT

Read-only privilege-count queries across public base tables (no application rows read):

| Development DB | Public tables | Role | TRUNCATE | MAINTAIN | SELECT | INSERT | UPDATE | DELETE |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| Marketing OS | 44 | anon | 36 | 36 | 0 | 0 | 0 | 0 |
| Marketing OS | 44 | authenticated | 36 | 36 | 1 | 0 | 0 | 0 |
| Marketing OS | 44 | service_role | 44 | 44 | 6 | 5 | 5 | 5 |
| CEO Back Office | 66 | anon | 31 | 31 | 0 | 0 | 0 | 0 |
| CEO Back Office | 66 | authenticated | 62 | 62 | 31 | 19 | 17 | 17 |
| CEO Back Office | 66 | service_role | 66 | 66 | 0 | 0 | 0 | 0 |

Public-schema table default ACL catalog also shows entries owned by both `postgres` and `supabase_admin`; these include broad API-role privileges (notably TRUNCATE and MAINTAIN, and the supabase_admin table defaults include DML privileges). Default ACL entries govern future objects created by those owners; effective privilege counts above separately cover current tables. This is a privilege-risk finding, not proof of an exploit or of a PostgREST endpoint exposing these privileges.

**Remediation remains blocked:** classify every affected object, owner, grantor, platform dependency and callsite; capture backup/restore/rollback evidence; then propose narrow Development-only corrections. Do not bulk-revoke grants or modify Production.
