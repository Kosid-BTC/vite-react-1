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
