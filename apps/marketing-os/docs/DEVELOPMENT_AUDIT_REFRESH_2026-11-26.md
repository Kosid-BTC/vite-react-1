# Development gate refresh — 2026-11-26

**Scope:** read-only audit of PR #23/#24, Supabase Development branch metadata/migration ledgers/Security Advisor, and authoritative Vercel deployment metadata. This note is documentation-only. No SQL/DDL/DML, function deployment, Cross-project application-data Read, merge, Vercel configuration change, or Production mutation was performed.

## Exact GitHub refs at audit time

- PR #24: OPEN / DRAFT / UNMERGED; head before this audit-note commit: `0c920d32528b0a313e4a1536445c2d3ea3018e1f`; API reports mergeable=true.
- PR #23: OPEN / DRAFT / UNMERGED; head `52c06743242ccc4dbf52f085acea02d1869c478a`; API reports mergeable=true.
- PR #24 exact-head PR workflows at `0c920d3...`: Offline CEO Back Office Contract run `45712231561` PASS; No-default-workspace Guard run `45712231404` PASS; Cross-project Read Guard run `45712231344` PASS.
- PR #23 exact-head Cross-project Read Guard run `45020906804` PASS.
- These checks are source/static/offline contracts and do not establish owner attestation, authenticated Tenant A/B, live RLS/RPC isolation, or Read-only Adapter E2E.
- Both PRs remain draft and unmerged.

## Supabase Development branch metadata

The correct Development targets are the branch project refs, not their parents.

| Environment | Parent project | Development project ref | Branch ID | Branch status | Preview DB status | With data |
|---|---|---|---|---|---|---|
| Marketing OS | `bjozpwdtqbpwcxnqguka` | `roprejhnhoaqlctltwfs` | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `MIGRATIONS_FAILED` | `ACTIVE_HEALTHY` | false |
| CEO Back Office | `waigsnxhrlwtiotspaim` | `tdeuyycqbbktacmxgktn` | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `FUNCTIONS_DEPLOYED` | `ACTIVE_HEALTHY` | false |

Both branches are non-default/non-persistent and have `with_data=false`. This is not backup or isolated-restore evidence.

## Migration ledger refresh

Read-only `list_migrations` results:

| Environment | Records | Latest version | Latest migration |
|---|---:|---|---|
| Marketing OS Development | 55 | `20261116022351` | `dev_restore_pg_cron_extension_for_behavior_maintenance` |
| CEO Back Office Development | 77 | `20261116022248` | `dev_fixture_for_data_dependent_marketing_seed` |

The Marketing OS branch status remains `MIGRATIONS_FAILED`; a migration ledger alone does not establish healthy replay or schema parity. No migration was applied.

## Fresh Security Advisor findings (Development only)

| Finding | Marketing OS Development | CEO Back Office Development |
|---|---:|---:|
| RLS enabled without policies | 7 | 8 |
| Policies exist while RLS is disabled | 0 | 2 |
| Authenticated-executable SECURITY DEFINER | 26 | 34 |
| Anon-executable SECURITY DEFINER | 0 | 17 |
| Mutable function search_path | 0 | 5 |
| Leaked-password protection advisory | Not returned | 1 |

These are Advisor findings, not proof of exploitability. Review the intended table access, authorization logic, call paths, ownership and grants before remediation. The CEO Back Office Development Advisor continues to flag `public.ensure_default_workspace()` as executable by authenticated; prior catalog evidence records implicit-first-workspace behavior. Do not invoke it or rely on it for workspace selection.

## Vercel authoritative project and exact SHA

- Project: `ceo-ai-marketing-os`; ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`; team `team_oryw9VGF4TLakA4qBU6pGx43`.
- SSO protection is enabled.
- Exact-SHA deployment lookup for `0c920d32528b0a313e4a1536445c2d3ea3018e1f` returned zero deployments.
- The latest visible authoritative deployment is READY on older SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target `null`; it is not an authenticated Preview for the PR candidate.
- A previous Preview deployment attempt was blocked by HTTP 402 `resource_creation_blocked` due to the team's overdue balance/valid payment-method prerequisite. This audit did not retry deployment or change billing.
- Exact-SHA authenticated Preview and Approved UX/UI V4 desktop/mobile visual acceptance remain UNVERIFIED.

## Acceptance disposition

- Trusted owner verification and dual-owner consent: UNVERIFIED.
- Workspace Mapping Registry runtime, expiry, revocation, replay prevention: UNVERIFIED.
- Dedicated non-`BYPASSRLS` audit identity: NOT READY.
- RLS/RPC runtime and Tenant A/B positive/negative tests: UNVERIFIED.
- Read-only Adapter E2E: UNVERIFIED.
- Authenticated exact-SHA Preview: UNVERIFIED/BLOCKED.
- Approved UX/UI V4 visual acceptance (1536x1024 and 390x844): UNVERIFIED.
- Cross-project application-data Read: OFF.
- Production: LOCKED.

**NOT PRODUCTION COMPLETE.**

## Fresh evidence refresh — 2026-11-26 08:47 ICT

This section supersedes stale deployment and branch references above. Read-only checks were performed against the current Development branch and authoritative Vercel project. No Production mutation, Development DDL/DML, migration, deployment, seed, or Cross-project application-data Read was performed.

### Exact refs and workflows
- PR #24 current head before this evidence commit: `a86051b800db1562c39edabfcb4f8737d426d97e`, OPEN / DRAFT / UNMERGED.
- Exact-head workflow runs: Cross-project Read Guard `45726795931` PASS; No-default-workspace Guard `45726795947` PASS; Offline CEO Back Office Contract `45726795937` PASS. Static/offline checks only.
- PR #20 current head `9c13f93697260acd443718ef607825f4712bc10a`: PR-triggered Actions lookup and combined status returned no current checks; authoritative exact-SHA deployment lookup returned 0.
- PR #34 current head `08a6ec4138393c1592c354eba0e61b3a7980c659`: exact-head Actions lookup returned 0; combined Vercel status is on legacy `ceoaimk`, not the authoritative project; exact-SHA deployment lookup returned 0.
- PR #33 current head `25347a2eee9deb384f62299f4bb6d80cacad5892`: explicit-workspace guard run `45407817007` PASS. PR #30 run `44992687838`, PR #31 run `45152600055`, and PR #32 run `45290896419` are exact-head PASS. These do not prove remote tenant isolation or live integration.

### Supabase Development — fresh direct read
- Marketing OS Development ref `roprejhnhoaqlctltwfs`, branch ID `e2139d78-2675-4863-ac64-a5fad7c8f826`, status `MIGRATIONS_FAILED`, preview status `ACTIVE_HEALTHY`, `with_data=false`.
- Migration ledger remains 55 entries; Production ledger 48; Development has 10 `dev_recover_*` entries and 3 Production-only migration versions absent in Development.
- Read-only counts: workspaces 0, brands 0, audience segments 0, business types 0, segment/business-type links 0, campaigns 0, content items 0, tracking links 0, evidence 0, cron jobs 0.
- `marketing_security.workspace_mapping_attestations` is absent.
- Current SQL connector session is `postgres`: `rolsuper=false`, `rolbypassrls=true`, `rolcreatedb=true`, `rolcreaterole=true`, `rolreplication=true`. It is not a least-privilege Tenant A/B identity.
- Security Advisor: 7 RLS-enabled tables without policies; 26 authenticated-executable SECURITY DEFINER functions. Health Advisor empty. No Development PostgreSQL ERROR rows returned in the queried 24-hour window.
- No canonical workspace/brand/seller rows were fabricated. No remote migration or seed was applied.

### Supabase Production — unchanged
- Production ref `bjozpwdtqbpwcxnqguka`: Health Advisor empty.
- Security Advisor: 7 RLS-enabled tables without policies; `pg_net` in public; 26 authenticated-executable SECURITY DEFINER functions.
- No Production Auth/RLS/Security settings or data changed.

### Vercel / Production runtime evidence
- Authoritative Production deployment remains `dpl_7WSDaycLq8vhWy8JbnFLy3rzzSvj`, SHA `536d928ca6ad94a3fcb2d388f6cd83350d634fed`, metadata READY.
- Latest authoritative Preview deployment remains `dpl_6hmFzFVNhu6XCRPeK8a1Xq6ce4zW`, old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target null.
- No Preview for current PR #20 or #34 candidates. Exact candidate deployment lookups returned 0.
- Current runtime error query (24h) and Production error/fatal log query (30m) returned no records. This does not establish direct homepage/login HTTP success or authenticated runtime.
- Direct Production homepage and login were not freshly verified through the web-access path; therefore HTTP/runtime smoke is UNVERIFIED. Earlier exact candidate logs recorded the Vercel overdue-balance `DEPLOYMENT_DISABLED` blocker; no billing change was made.

### Acceptance
- READY FOR USE: NOT PASS — approved UX/UI V4 is not freshly verified on live Production and all post-deploy gates are not complete.
- UX/UI CONFIRMATION: UNVERIFIED — no authenticated Production screenshots at 1536x1024 and 390x844; no structural/order assertions from live Production.
- Owner attestation, mapping registry runtime/expiry/revocation, dedicated non-BYPASSRLS identity, backup integrity, PostgreSQL 17 isolated restore, rollback parity, authenticated Tenant A/B, one-way Landing Page/Attribution E2E, and exact-SHA authoritative Preview remain BLOCKED/UNVERIFIED.
- Cross-project application-data Read remains OFF. Production remains LOCKED.

**NO-GO / NOT PRODUCTION COMPLETE.**


## Post-audit verification — 2026-11-26 (latest connector snapshot)

This addendum supersedes the preceding PR-head and exact-deployment references. Scope remained Development metadata, source CI, and authoritative Vercel deployment metadata only. No application-row read, SQL execution, DDL/DML, migration, seed, function deployment, Vercel configuration change, deployment, merge, Cross-project application-data Read, or Production mutation was performed.

### GitHub exact refs and CI

- PR #24 API head: `873363be86ef646ee5ef6f4a203d946deebb1916`; OPEN / DRAFT / UNMERGED; mergeable=true.
- PR #23 API head: `52c06743242ccc4dbf52f085acea02d1869c478a`; OPEN / DRAFT / UNMERGED; mergeable=true.
- Compare PR #23 → PR #24: DIVERGED, ahead 116 / behind 7; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`. Do not merge wholesale.
- Exact-head PR #24 workflows for `873363be...`:
  - Cross-project Read Guard run `45738416695` — PASS.
  - No-default-workspace Guard run `45738416666` — PASS.
  - Offline CEO Back Office Contract run `45738416730` — PASS.
- Job-step inspection confirms the Cross-project workflow completed the explicit-workspace own-property check, fail-closed adapter exercise, Approved UX/UI V4 source-contract check, Marketing OS typecheck, and offline-placeholder build. The offline workflow completed dual-owner, mapping/evidence, explicit-workspace, and static Development SQL proposal checks.
- These are source/static/offline checks. They do not prove owner identity, a live mapping registry, authenticated Tenant A/B, live RLS/RPC isolation, or adapter E2E.

### Supabase Development branch and migration inventory

Branch metadata was read from each parent project:

| Environment | Parent | Development ref | Branch ID | Status | Preview DB | with_data |
|---|---|---|---|---|---|---|
| Marketing OS | `bjozpwdtqbpwcxnqguka` | `roprejhnhoaqlctltwfs` | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `MIGRATIONS_FAILED` | `ACTIVE_HEALTHY` | false |
| CEO Back Office | `waigsnxhrlwtiotspaim` | `tdeuyycqbbktacmxgktn` | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `FUNCTIONS_DEPLOYED` | `ACTIVE_HEALTHY` | false |

- Marketing OS Development: 55 migration records; latest `20261116022351` / `dev_restore_pg_cron_extension_for_behavior_maintenance`. The ledger contains 9 names beginning `dev_recover_` plus the separate `dev_restore_` entry. Branch status remains `MIGRATIONS_FAILED`.
- CEO Back Office Development: 77 migration records; latest `20261116022248` / `dev_fixture_for_data_dependent_marketing_seed`.
- The branch project-detail endpoint returned NotFound for both branch refs in this run; branch metadata, migration inventory, advisors, and table metadata endpoints did resolve them. Do not substitute either parent project for a Development target.
- Table metadata listing returned 44 Marketing OS public tables and 66 CEO Back Office public tables. No `marketing_security.workspace_mapping_attestations` table was listed in either Development target.
- Both branches are non-default/non-persistent and `with_data=false`; this is not backup, restore, or rollback evidence.

### Development Security Advisor and critical RLS finding

Fresh Development Advisor results:

| Finding | Marketing OS Development | CEO Back Office Development |
|---|---:|---:|
| RLS enabled / no policy | 7 | 8 |
| Policy exists / RLS disabled | 0 | 2 |
| Authenticated-executable SECURITY DEFINER | 26 | 34 |
| Anon-executable SECURITY DEFINER | 0 | 17 |
| Mutable function search_path | 0 | 5 |
| Leaked-password protection disabled | Not returned | 1 |

**Critical table-metadata advisory on CEO Back Office Development:** RLS is disabled on `public.profiles`, `public.organizations`, `public.organization_members`, and `public.standards`. The Supabase table metadata response warns that these tables are exposed to the `anon` and `authenticated` API roles under the current grants. This is a Development-branch finding, not a claim about Production.

The tool-provided RLS-enable statements are recorded as a proposal only and were NOT executed:

```sql
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."standards" ENABLE ROW LEVEL SECURITY;
```

Do not run these statements alone: enabling RLS without reviewed policies can block legitimate application access. First define and review table-specific owner/member/admin policies, validate dependent RPCs and service call paths, and prove backup/restore/rollback in an isolated PostgreSQL 17 environment. No bulk grants or policy changes are authorized by this audit.

Marketing OS Development still has seven RLS-enabled/no-policy findings: `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, and `youtube_quota`. Review intended API grants and service-only access table by table; do not add broad policies merely to silence the Advisor.

### Authoritative Vercel

- Project: `ceo-ai-marketing-os`; ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`; team `team_oryw9VGF4TLakA4qBU6pGx43`; SSO protection enabled.
- Exact-SHA lookup for PR #24 head `873363be86ef646ee5ef6f4a203d946deebb1916`: **0 deployments**.
- Latest visible deployment remains READY on older SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target `null`; it is not an authenticated PR Preview.
- No deployment was attempted in this run. The previously observed HTTP 402 billing/resource-creation blocker remains unresolved unless separately cleared by the Team owner.

### Release disposition

- CI exact-head source/offline checks: PASS.
- Marketing OS Development migration recovery: FAIL / `MIGRATIONS_FAILED`.
- CEO Back Office Development critical RLS-disabled tables: FAIL / remediation required.
- Owner-attestation registry and independent owner verification: UNVERIFIED.
- Dedicated non-`BYPASSRLS` audit identity and authenticated Tenant A/B: NOT READY / NOT RUN.
- Read-only Adapter E2E: UNVERIFIED; keep fail-closed.
- Exact-SHA authoritative Preview: NOT AVAILABLE; zero deployments.
- Approved UX/UI V4 source contract: PASS in CI; authenticated desktop/mobile visual acceptance: UNVERIFIED.
- Cross-project application-data Read: OFF.
- Production: LOCKED.

**NO-GO / NOT PRODUCTION COMPLETE.**


## Post-contract hardening and catalog ACL verification — 2026-11-26

This addendum supersedes the previous code-head and Development security snapshots. All database queries in this section were SELECT-only catalog/privilege metadata queries against the two Development branches. No application records were read. No DDL/DML, migration, seed, function deployment, secret read/change, Vercel setting change, deployment, merge, Cross-project application-data Read, or Production mutation was performed.

### Exact GitHub refs and CI before this documentation-only commit

- PR #24 code/test head: `1d4c9b83dea8bced489be976aa134fdfba38f949`; OPEN / DRAFT / UNMERGED.
- PR #23 head: `52c06743242ccc4dbf52f085acea02d1869c478a`; OPEN / DRAFT / UNMERGED.
- Compare PR #23 → PR #24 code/test head: DIVERGED, ahead 122 / behind 7; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- Exact-head PR-triggered workflows for `1d4c9b8...`:
  - Cross-project Read Guard run `45753669172` — PASS.
  - No-default-workspace Guard run `45753669101` — PASS.
  - Offline CEO Back Office Contract run `45753669114` — PASS.
- The cross-project job confirms explicit own-property UUID checks, adapter fail-closed (2 calls / 0 network calls), Approved UX/UI V4 source contract, TypeScript typecheck, and offline-placeholder Full Build all passed. The offline job confirms both owner/mapping contracts, UUID regression, and comment-only Development SQL proposal verifiers passed.
- Code hardening in this head pins the pure attestation type to the two verified Development branch refs and requires explicit UUID-shaped workspace IDs. It does not implement trusted owner verification, a registry read path, or cross-project access. Production refs are deliberately rejected by the Development-only contract.

### Supabase Development: branch and migration state

| Environment | Development ref | Branch ID | Status | Preview DB | with_data |
|---|---|---|---|---|---|
| Marketing OS | `roprejhnhoaqlctltwfs` | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `MIGRATIONS_FAILED` | `ACTIVE_HEALTHY` | false |
| CEO Back Office | `tdeuyycqbbktacmxgktn` | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `FUNCTIONS_DEPLOYED` | `ACTIVE_HEALTHY` | false |

- Marketing OS: 55 migration records; latest `20261116022351`; branch remains `MIGRATIONS_FAILED`.
- CEO Back Office: 77 migration records; latest `20261116022248`.
- No mapping registry table was listed in the `marketing_security` schema on either branch.
- Neither branch has data copied from its parent. No backup/restore/rollback acceptance is implied.

### Fresh Development RLS, policies, RPC and effective privilege findings

**CEO Back Office Development**
- Four public tables have RLS disabled: `profiles`, `organizations`, `organization_members`, `standards`.
- `organizations` and `organization_members` have INSERT-only policies, but RLS is disabled so those policies are not enforcing row access. `profiles` and `standards` have no policies in the inspected catalog.
- `workspaces` and `workspace_members` have RLS enabled but FORCE RLS disabled. Their existing policies are owner/member-oriented; they do not neutralize table-level TRUNCATE privileges.
- `public.ensure_default_workspace()` remains SECURITY DEFINER, owner `postgres`, EXECUTE granted to `authenticated`; it selects the earliest membership and creates a personal workspace if none exists. Do not invoke it.
- `public.create_workspace(text)` is SECURITY DEFINER and has an `auth.uid() IS NULL` guard.

**Marketing OS Development**
- No public table in the inspected table list has RLS disabled.
- Seven tables remain RLS-enabled with no policies: `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, and `youtube_quota`. The inspected API-role privileges on these seven tables were false for anon/authenticated SELECT, INSERT, UPDATE, DELETE and TRUNCATE; review intended service-only call paths rather than adding broad policies.
- `workspaces` and `workspace_members` have RLS enabled but FORCE RLS disabled, with owner/member policies; both still have anon/authenticated TRUNCATE and MAINTAIN privileges.
- `public.ensure_default_workspace()` remains SECURITY DEFINER, owner `postgres`, EXECUTE granted to `authenticated`, with implicit earliest-membership selection and personal-workspace creation.
- `public.create_workspace(text)` is SECURITY DEFINER but does not currently contain the `auth.uid() IS NULL` guard present on the CEO Back Office Development branch.

**Critical default-privilege finding on both Development branches**
- Read-only PostgreSQL catalog checks show effective TRUNCATE and MAINTAIN privileges for API roles on many public tables:
  - CEO Back Office Development: anon on 31/66 public tables; authenticated on 62/66.
  - Marketing OS Development: anon on 36/44 public tables; authenticated on 36/44.
- The same aggregate counts apply to MAINTAIN. Direct table ACL inspection confirms grantor `postgres` on the six inspected CEO core tables and on Marketing `workspaces` / `workspace_members`.
- Default ACL catalog entries show both `postgres` and `supabase_admin` have public-schema default privileges granting TRUNCATE and MAINTAIN to `anon` and `authenticated`. This can reintroduce the privilege on newly created tables. Do not bulk-revoke or change default ACLs without owner/dependency review and an isolated rollback.
- The Supabase table-listing advisory describes the four RLS-disabled CEO tables as fully exposed. The separate effective-privilege query did **not** confirm anon/authenticated SELECT, INSERT, UPDATE or DELETE on those four tables; it **did** confirm anon/authenticated TRUNCATE and MAINTAIN. No PostgREST TRUNCATE route or exploitation was tested. Treat the RLS-off state and direct destructive privileges as critical Development security debt, without claiming a demonstrated exploit.
- The SQL connector session is privileged `postgres` with BYPASSRLS=true. It cannot be used as a Tenant A/B acceptance identity.

The Supabase-generated RLS-enable statements remain a proposal only and were not executed:

```sql
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."standards" ENABLE ROW LEVEL SECURITY;
```

Do not run these four statements alone: without table-specific policies they can block legitimate access. Prepare reviewed owner/member/admin policies, API privilege corrections, default-ACL remediation, and RPC dependency tests only after backup attestation, PostgreSQL 17 isolated restore, schema parity, and rollback proof.

### Authoritative Vercel

- Project `ceo-ai-marketing-os`, ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`; team `team_oryw9VGF4TLakA4qBU6pGx43`; SSO protection enabled.
- Exact-SHA deployment lookup for `1d4c9b83dea8bced489be976aa134fdfba38f949`: 0 deployments.
- Combined GitHub Vercel status is pending under legacy `usrt-btc/ceoaimk`, not authoritative project acceptance.
- Latest visible authoritative deployment remains READY on old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target `null`. No Authenticated Preview or V4 visual acceptance is established.

### Release disposition

- Exact-head PR CI source/static/offline/build checks: PASS 3/3.
- Marketing OS Development recovery: FAIL / `MIGRATIONS_FAILED`.
- CEO Back Office Development RLS and API privilege posture: FAIL / critical remediation required.
- Trusted owner verification and mapping registry runtime: UNVERIFIED.
- Dedicated non-`BYPASSRLS` audit identity and Tenant A/B: NOT READY / NOT RUN.
- Read-only Adapter E2E: UNVERIFIED; remain fail-closed.
- Exact-SHA authoritative Preview: unavailable; zero deployments.
- Approved UX/UI V4 source contract: PASS; authenticated desktop/mobile visual acceptance: UNVERIFIED.
- Cross-project application-data Read: OFF.
- Production: LOCKED.

**NO-GO / NOT PRODUCTION COMPLETE.**
