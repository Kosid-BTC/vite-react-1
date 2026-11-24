# Development-only tenant isolation acceptance matrix (2026-11-18)

**Scope:** PR #24 and PR #23. This document is a test plan, **not** evidence that tests ran. Cross-project Read remains OFF. Do not apply any SQL to Production.

## Preconditions
- Dedicated, isolated Supabase Development project; synthetic Tenant A and Tenant B only.
- Two independently authenticated owner sessions (primary and supplementary), plus non-owner and expired sessions.
- Trusted server verifies both owner consent events against their respective Auth contexts. Neither workspace name, email, row order, nor user UUID alone establishes a mapping.
- No service-role credential in client or read-only adapter. No automatic first-workspace fallback.
- Every read rechecks owner attestation, mapping expiry, revocation, active membership, and explicit workspace selection. Fail closed on network errors.

## Executable acceptance scenarios (to implement and capture evidence)

| ID | Scenario | Expected result |
|---|---|---|
| MAP-01 | No explicit workspace selection | DENY; never select first workspace |
| MAP-02 | Primary owner verified, supplementary owner unverified | DENY |
| MAP-03 | Both owner consents independently verified and unexpired | Eligible for scoped read only; no implicit enablement |
| MAP-04 | Forged/replayed consent event ID | DENY |
| MAP-05 | Mapping expires exactly at request time | DENY |
| MAP-06 | Mapping revoked after first successful read | Next read DENY; no cached authorization |
| MAP-07 | Tenant A user requests Tenant B mapping | DENY |
| MAP-08 | Same email/name but unrelated workspaces | DENY |
| MAP-09 | One-to-many or many-to-one mapping attempt | DENY at registry constraint |
| MAP-10 | Consent evidence digest does not match the independently verified event | DENY |
| MAP-11 | Reuse of a consent event ID | DENY at unique constraint; no replay |
| MAP-12 | Second non-revoked mapping for either workspace | DENY at active uniqueness constraint |
| MAP-13 | Replace an expired mapping without first recording revocation | DENY; revoke the old attestation before re-attestation |
| RLS-01 | Tenant A SELECT Tenant B rows | Zero rows / permission denied |
| RLS-02 | Anonymous user SELECT protected rows | DENY |
| RPC-01 | Authenticated non-owner calls SECURITY DEFINER RPC | DENY, even if EXECUTE granted |
| RPC-02 | RPC search_path manipulation attempt | DENY; fixed trusted search_path |
| RPC-03 | Missing or invalid JWT | DENY |
| ADP-01 | Supplementary read uses primary token | DENY |
| ADP-02 | Read-only adapter attempts insert/update/delete | Not exposed; DENY |
| ADP-03 | Adapter requests non-allowlisted field | DENY |
| ADP-04 | Supplementary auth/network unavailable | DENY without fallback |
| UX-01 | Authenticated desktop 1536×1024 on exact SHA | Capture and compare Approved V4 reference |
| UX-02 | Authenticated mobile 390×844 on exact SHA | Capture and compare Approved V4 reference |

## Evidence requirements
For each scenario record test ID, Development project ref, isolated test tenant identifiers, exact Git SHA, UTC timestamp, expected/actual status, sanitized logs, and CI job URL. Store only SHA-256 evidence digests and non-secret consent event identifiers in the proposed registry; never store raw tokens, JWTs, API keys, or personal customer records in test artifacts. Require both positive and negative tests. The SQL proposal checker is static-only and does not apply or execute SQL. Offline regex/source checks are not runtime evidence.

## Release rule
A successful offline contract workflow, READY deployment, or an RLS-enabled flag **alone** is not a Production acceptance. Require runtime tenant-isolation results, independently verified owner consent, expiry/revocation checks, authenticated exact-SHA previews, and Approved UX/UI V4 desktop/mobile evidence before any Production changes or enabling Cross-project Read.

## Latest Development catalog-only preflight — 2026-11-24 (approximately 06:07 UTC)

This is a read-only PostgreSQL catalog/privilege snapshot for the two Development branches. It is not a runtime Tenant A/B test and does not authorize a migration or Production change.

| Environment | Branch ID | Project ref | Branch status | With data |
|---|---|---|---|---|
| CEO Back Office Development | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `tdeuyycqbbktacmxgktn` | `FUNCTIONS_DEPLOYED` | false |
| Marketing OS Development | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `roprejhnhoaqlctltwfs` | `MIGRATIONS_FAILED` | false |

### CEO Back Office Development
- 66 public tables.
- RLS is disabled on four tables: `organization_members`, `organizations`, `profiles`, and `standards`.
- `organization_members` and `organizations` each have one policy while RLS is disabled; `profiles` and `standards` have no policies.
- On these four RLS-disabled tables, the catalog reports no effective anon/authenticated SELECT, INSERT, UPDATE, or DELETE privilege, but both roles do have effective TRUNCATE privilege.
- Across all public tables, effective TRUNCATE counts are anon 31, authenticated 62, service_role 66.

### Marketing OS Development
- 44 public tables.
- No public table was found with RLS disabled.
- Seven tables have RLS enabled with no policy: `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, and `youtube_quota`. These require table-by-table grant and service-call-path review; an RLS flag alone does not establish a usable API path.
- Across all public tables, effective TRUNCATE counts are anon 36, authenticated 36, service_role 44.

### Shared privilege finding
- In both Development databases, `pg_default_acl` contains public-schema table defaults created under both `postgres` and `supabase_admin` that include TRUNCATE for `anon`, `authenticated`, and `service_role`.
- This is an effective-privilege finding, not evidence that PostgREST exposes a TRUNCATE endpoint or that a destructive action occurred.
- Do not bulk-revoke service_role privileges until backend/service callsites, table ownership, default-privilege owners, and operational maintenance dependencies are reviewed. Any ACL correction remains a separate Development-only proposal requiring backup/restore and rollback evidence.
- The catalog SQL session was `postgres` with `BYPASSRLS=true`. The queries in this audit were SELECT-only, but this identity cannot prove end-user RLS isolation. A dedicated non-BYPASSRLS identity is still required.
- No SQL/DDL/DML was applied, no application rows were queried, and no cross-project application data was read.

**Disposition:** keep both PRs Draft; keep Cross-project Read OFF; keep Production LOCKED; do not treat this catalog preflight as Tenant A/B or Production acceptance.


## Fresh Development catalog-only recheck — 2026-11-24 approximately 08:07 UTC

This update supersedes the earlier approximately 06:07 UTC snapshot. Scope is PostgreSQL catalog, effective privilege, function-definition, branch metadata, GitHub CI, and Vercel deployment metadata only. No application rows, secrets, customer records, or cross-project application data were read.

### Exact GitHub refs and checks

- PR #24: OPEN / DRAFT / UNMERGED; head `9a65ab654aec4e7abe373277dee0f14da9cf6ad8`.
- PR #23: OPEN / DRAFT / UNMERGED; head `52c06743242ccc4dbf52f085acea02d1869c478a`.
- PR #23 → PR #24 remains DIVERGED: 70 commits ahead / 7 behind; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- PR #24 exact-head PR workflows: Cross-project Read Guard run `45338513687` PASS; No-default-workspace Guard run `45338513794` PASS; Offline CEO Back Office Contract run `45338513731` PASS. These are source/static/offline/typecheck checks, not database integration or authenticated Tenant A/B evidence.
- PR #23 exact-head Cross-project Read Guard run `45020906804` PASS; this does not establish runtime isolation.
- Adjacent PR #32 is a separate OPEN / DRAFT branch at `e4c4addcf3e78775ab01e1319455c5532f8955a5`. Its Edge Function Workspace Binding Guard run `45290896419` PASS is static-only and is not part of PR #24 or PR #23.
- No PR was merged.

### Development branch status

| Environment | Branch ID | Project ref | Status | With data |
|---|---|---|---|---|
| CEO Back Office Development | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `tdeuyycqbbktacmxgktn` | `FUNCTIONS_DEPLOYED` | false |
| Marketing OS Development | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `roprejhnhoaqlctltwfs` | `MIGRATIONS_FAILED` | false |

### Actual SQL audit principal — both Development branches

The read-only SQL connector session reported current_user/session_user = `postgres`, SUPERUSER=false, BYPASSRLS=true, CREATEDB=true, CREATEROLE=true. This is not a least-privilege principal and cannot prove end-user RLS isolation. No dedicated non-BYPASSRLS Tenant A/B identity was exercised.

### CEO Back Office Development catalog

- 66 public tables; 4 have RLS disabled; 62 have RLS enabled but not FORCE RLS.
- Effective TRUNCATE privilege counts: anon 31, authenticated 62, service_role 66.
- 34 SECURITY DEFINER functions are executable by authenticated.
- RLS-disabled tables remain `organization_members`, `organizations`, `profiles`, and `standards`.
- No application rows were selected.

### Marketing OS Development catalog

- 44 public tables; 0 have RLS disabled; 44 have RLS enabled but not FORCE RLS.
- Effective TRUNCATE privilege counts: anon 36, authenticated 36, service_role 44.
- 26 SECURITY DEFINER functions are executable by authenticated.
- Seven RLS-enabled/no-policy tables remain subject to table-by-table grant and service-call-path review.
- No application rows were selected.

### Default table ACL and RPC evidence

Both Development databases contain public-schema default table ACL entries for object creators `postgres` and `supabase_admin`. The `postgres` default ACL includes TRUNCATE (`D`) for anon, authenticated, and service_role. The `supabase_admin` default ACL includes broad table privileges, including TRUNCATE, for those API roles. This is a default-privilege exposure finding; it does not prove a PostgREST TRUNCATE route or an actual destructive operation. Do not bulk-revoke without owner-specific review, service-callsite analysis, backup/restore, and rollback evidence.

On both Development branches, `public.ensure_default_workspace()` is owned by postgres, SECURITY DEFINER, and executable by authenticated. Its current definition selects the earliest membership by created_at and creates a personal workspace when none exists. Do not invoke it; explicit workspace selection remains mandatory.

Marketing Development also has `public.receive_marketing_behavior(uuid,uuid,text,jsonb,text,text)`, SECURITY INVOKER with EXECUTE granted only to service_role. Its current definition validates that the supplied workspace ID belongs to the local project and has slug `ceo-ai-thailand`, applies rate limits, and writes a behavior batch. It does not independently verify a dual-owner attestation or caller workspace membership; the Edge Function/service boundary must be reviewed separately. This is not a cross-project read.

### Vercel exact-SHA status

- Authoritative project: `ceo-ai-marketing-os`, ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`.
- Exact PR #24 head `9a65ab654aec4e7abe373277dee0f14da9cf6ad8`: zero deployments found.
- Latest visible authoritative deployment remains READY on older SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target null.
- PR #21 SHA `97ed57dff1fe308406afcc7d426d81dc93ac2a33` has a READY deployment with target null; it is not an authenticated PR #24 Preview.
- No authenticated Preview or V4 visual acceptance is established.

**Disposition:** no SQL/DDL/DML, secret change, function deployment, Vercel setting change, merge, or Production mutation. Keep PR #23/#24 Draft, Cross-project Read OFF, and Production LOCKED. NOT PRODUCTION COMPLETE.


## Fresh Development, Security and Release Snapshot — 2026-11-24 10:08 UTC

This snapshot was collected with GitHub PR/status reads, Supabase project/branch metadata, migration inventory, Security Advisor, and **SELECT-only PostgreSQL catalog queries**. It is not a runtime tenant-isolation test. No application rows were queried.

### Project and branch identity

| System | Parent project | Parent status | Development project ref | Branch ID | Branch status | With data |
|---|---|---|---|---|---|---|
| CEO Back Office | `waigsnxhrlwtiotspaim` (`CEO Ai Thailand`) | `ACTIVE_HEALTHY` | `tdeuyycqbbktacmxgktn` | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `FUNCTIONS_DEPLOYED` | false |
| Marketing OS | `bjozpwdtqbpwcxnqguka` (`CEOAITHAILAND Marketing`) | `ACTIVE_HEALTHY` | `roprejhnhoaqlctltwfs` | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `MIGRATIONS_FAILED` | false |

Migration inventory is not migration-replay evidence:
- CEO Back Office Development: 77 listed migration records; latest listed version `20261116022248`.
- Marketing OS Development: 55 listed migration records; latest listed version `20261116022351`.
- Supabase branch metadata still reports Marketing OS Development as `MIGRATIONS_FAILED`. No reset, rebase, merge, migration apply, or repair was attempted.

### Fresh catalog-only security results

Both SQL sessions ran as `postgres` with `BYPASSRLS=true`. Queries read PostgreSQL catalogs and privilege metadata only.

| Finding | CEO Back Office Development | Marketing OS Development |
|---|---:|---:|
| Public tables | 66 | 44 |
| RLS disabled | 4 | 0 |
| RLS enabled but no policy | 8 | 7 |
| RLS enabled but FORCE RLS disabled | 62 | 44 |
| Effective anon TRUNCATE | 31 | 36 |
| Effective authenticated TRUNCATE | 62 | 36 |
| Effective service_role TRUNCATE | 66 | 44 |
| `marketing_security.workspace_mapping_attestations` exists | No | No |

CEO Back Office Development RLS-disabled tables:
`organization_members`, `organizations`, `profiles`, `standards`.

CEO Back Office Development RLS-enabled/no-policy tables:
`ai_usage`, `checkup_leads`, `client_errors`, `founding_members`, `handoff_nonces`, `landing_funnel`, `quickcheck_submissions`, `referrals`.

Marketing OS Development RLS-enabled/no-policy tables:
`marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, `youtube_quota`.

In both branches, the `public` default table ACLs owned by `postgres` and `supabase_admin` include TRUNCATE for `anon`, `authenticated`, and `service_role`. This is a privilege finding, not evidence that an API endpoint exposed TRUNCATE or that any destructive operation occurred. Do not bulk-revoke; review ownership and service dependencies first.

In both branches:
- `anon` and `authenticated` have `BYPASSRLS=false`.
- `postgres`, `service_role`, and `supabase_read_only_user` have `BYPASSRLS=true`.
- The active SQL connector identity is `postgres`; it cannot prove end-user RLS isolation.
- `public.ensure_default_workspace()` is `SECURITY DEFINER`, has `search_path=public`, is executable by `authenticated`, and is not executable by `anon`. Its current definition selects a membership ordered by `created_at` and creates a Personal Workspace if no membership exists. Do not invoke it; the Development-only revoke proposal remains unapplied.

### Fresh Security Advisor snapshot

Observed at approximately 2026-11-24 10:08 UTC:

| Finding | CEO Back Office Development | Marketing OS Development |
|---|---:|---:|
| Policies exist while RLS is disabled | 2 | 0 |
| RLS enabled without policies | 8 | 7 |
| Mutable function search_path | 5 | 0 |
| Anon-executable SECURITY DEFINER functions | 17 | 0 |
| Authenticated-executable SECURITY DEFINER functions | 34 | 26 |

Review each finding against intended API/service call paths; counts alone do not establish exploitability.

### Exact-SHA CI and Vercel

- PR #24 head: `2cdeeb735684c8db117e5fc9c423e72863dfc17a` (OPEN / DRAFT / UNMERGED).
- Exact-head PR workflows: Cross-project Read Guard run `45353817160` PASS; No-default-workspace Guard run `45353817140` PASS; Offline CEO Back Office Contract run `45353817238` PASS.
- PR #23 head: `52c06743242ccc4dbf52f085acea02d1869c478a`; Cross-project Read Guard run `45020906804` PASS.
- PR #32 head: `e4c4addcf3e78775ab01e1319455c5532f8955a5`; Edge Function Workspace Binding Guard run `45290896419` PASS.
- These are source/static/offline/typecheck checks, not authenticated Tenant A/B or live database integration tests.
- Authoritative Vercel project: `ceo-ai-marketing-os`, ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`. Exact-SHA deployment lookup for PR #24 head `2cdeeb7...` returned zero deployments.
- The GitHub combined Vercel status is `success` but its target is under legacy project `usrt-btc/ceoaimk`, not the authoritative project.
- Latest visible authoritative deployment remains READY on old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, with target `null`. This is not an authenticated Preview acceptance.

**Disposition:** no SQL/DDL/DML, function deployment, secret read/change, Vercel setting change, merge, or Production mutation. Keep the adapter fail-closed, Cross-project Read OFF, PRs Draft, and Production LOCKED. **NOT PRODUCTION COMPLETE.**


### Approved UX/UI V4 reference-file verification — 2026-11-24

The two exact locked reference images named in `APPROVED_UI_V4_SOURCE.md` were located in the user's Library and opened as native images for visual inspection:

| Reference | Library file ID | Verification |
|---|---|---|
| `0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg` | `libfile_c6e93128754081919581bba7b947b47b` | Present and visually inspected |
| `4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg` | `libfile_132cb5d89084819195666882aad11e2f` | Present and visually inspected |

This closes the **reference-asset availability** check only. It does not establish visual acceptance of an application deployment: no authenticated exact-SHA Preview exists for the current PR #24 candidate, and no candidate Desktop 1536×1024 or Mobile 390×844 screenshots were captured or compared. UX/UI V4 deployment acceptance therefore remains UNVERIFIED.


### Current Development security and release-gate refresh — 2026-11-24 19:06 ICT (12:06 UTC)

**Scope:** read-only verification of the PR refs, Development branch metadata, PostgreSQL catalogs, Supabase Security Advisors, and the authoritative Vercel project. No application rows were queried. No SQL/DDL/DML, migration, Edge Function deployment, secret read/change, Vercel configuration change, merge, or Production mutation was performed. Cross-project application-data Read remains OFF.

#### GitHub exact refs and CI

- PR #24: OPEN / DRAFT / UNMERGED; exact head `09a14bd0d06713013cc78ebdb91f6a9c6a6c0a65`; base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- PR #23: OPEN / DRAFT / UNMERGED; exact head `52c06743242ccc4dbf52f085acea02d1869c478a`.
- Compare PR #23 head → PR #24 head: DIVERGED, PR #24 ahead 73 / behind 7; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`. Do not merge wholesale.
- PR #24 exact-head PR workflows: Cross-project Read Guard run `45372761952` PASS; Offline CEO Back Office Contract run `45372761891` PASS; No-default-workspace Guard run `45372762025` PASS. These are source/static/offline checks, not authenticated Tenant A/B or database integration tests.
- PR #23 exact-head workflow run `45020906804` PASS (Cross-project Read Guard); the combined-status endpoint returned no status entries.

#### Supabase Development metadata and catalog-only audit

- CEO Back Office Development: parent `waigsnxhrlwtiotspaim`; branch `dev-backoffice-rls-hardening`; project ref `tdeuyycqbbktacmxgktn`; branch status `FUNCTIONS_DEPLOYED`; `with_data=false`; 77 migration records; latest recorded migration `20261116022248`.
- Marketing OS Development: parent `bjozpwdtqbpwcxnqguka`; branch `dev-marketing-mapping-attestation`; project ref `roprejhnhoaqlctltwfs`; branch status `MIGRATIONS_FAILED`; `with_data=false`; 55 migration records; latest recorded migration `20261116022351`.
- Both read-only catalog sessions reported PostgreSQL `17.11`, session user `postgres`, and `BYPASSRLS=true`. This identity cannot prove end-user RLS isolation.
- `marketing_security.workspace_mapping_attestations` is absent in both Development databases.
- In both branches, `public.ensure_default_workspace()` remains SECURITY DEFINER, owned by `postgres`, `search_path=public`, executable by `authenticated` (not `anon`), and selects the earliest membership by `created_at`, creating a Personal Workspace when none exists. Do not invoke it.
- CEO selected-table catalog check: `organizations` and `organization_members` have RLS disabled despite one policy each; `workspaces` and `workspace_members` have RLS enabled but FORCE RLS disabled.
- Marketing selected-table catalog check: seven tables remain RLS-enabled with zero policies — `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, and `youtube_quota`. `workspaces` and `workspace_members` have RLS enabled but FORCE RLS disabled.

#### Security Advisor snapshot

Observed at 2026-11-24 12:09 UTC:

| Finding | CEO Back Office Development | Marketing OS Development |
|---|---:|---:|
| Policies exist while RLS is disabled | 2 | 0 |
| RLS enabled without policies | 8 | 7 |
| Mutable function search_path | 5 | 0 |
| Anon-executable SECURITY DEFINER functions | 17 | 0 |
| Authenticated-executable SECURITY DEFINER functions | 34 | 26 |
| Leaked-password protection advisory | 1 | Not returned |

Counts require function/table-level review; they do not alone establish exploitability. No remediation was applied.

#### Authoritative Vercel Preview

- Project `ceo-ai-marketing-os`, ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`, team `team_oryw9VGF4TLakA4qBU6pGx43`; SSO protection is enabled.
- Exact-SHA deployment lookup for PR #24 head `09a14bd0d06713013cc78ebdb91f6a9c6a6c0a65` returned **zero deployments**.
- GitHub combined Vercel status is SUCCESS but targets legacy project `usrt-btc/ceoaimk`, not the authoritative project.
- Latest visible authoritative deployment remains READY on old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target `null`; it is not an authenticated Preview acceptance.

#### UX/UI V4 and disposition

- The exact two locked reference assets are recorded in the preceding verification entry and `APPROVED_UI_V4_SOURCE.md`. This verifies reference-asset availability only; no exact-candidate Preview screenshots exist for Desktop 1536×1024 or Mobile 390×844, so deployed visual acceptance remains UNVERIFIED.
- Backup integrity, PostgreSQL 17 isolated restore, migration semantic parity, and rollback evidence remain UNVERIFIED. No dedicated non-BYPASSRLS audit identity is ready. Tenant A/B, mapping attestation runtime, and Read-only Adapter E2E have not run.
- Keep PR #23/#24 Draft, the supplementary adapter fail-closed, Cross-project application-data Read OFF, and Production LOCKED. **NOT PRODUCTION COMPLETE.**
