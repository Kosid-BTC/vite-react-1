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
