# Development ACL / RLS Remediation Matrix — 2026-11-26

**Disposition: PREPARATION ONLY / NO SQL EXECUTED / NO CROSS-PROJECT APPLICATION-DATA READ / PRODUCTION LOCKED**

This matrix records catalog-only findings and proposes a gated remediation sequence. It is not an executable migration and does not authorize applying ACL, RLS, RPC, or migration changes.

## Exact Development scope

| System | Development Project Ref | Branch ID | Current branch state |
|---|---|---|---|
| Marketing OS | `roprejhnhoaqlctltwfs` | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `MIGRATIONS_FAILED` |
| CEO Back Office | `tdeuyycqbbktacmxgktn` | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `FUNCTIONS_DEPLOYED` |

Both branches are non-default and `with_data=false`. Preview DB health alone is not migration, backup, or recovery acceptance.

## Catalog-only observations

The checks were SELECT-only, scoped to the two Development project refs, and did not read tenant application rows.

| Finding | Marketing OS Development | CEO Back Office Development | Risk / status |
|---|---:|---:|---|
| RLS-disabled public base tables | 0 | 4 | CEO Back Office: remediation required |
| `anon` tables with TRUNCATE | 36 | 31 | Critical review / no revocation yet |
| `authenticated` tables with TRUNCATE | 36 | 62 | Critical review / no revocation yet |
| `anon` tables with MAINTAIN | 36 | 31 | Critical review / no revocation yet |
| `authenticated` tables with MAINTAIN | 36 | 62 | Critical review / no revocation yet |
| Public schema default ACL entries | 6 | 6 | Review grantor, grantee and object scope |

### CEO Back Office RLS-disabled tables

- `public.profiles`
- `public.organizations`
- `public.organization_members`
- `public.standards`

Do not simply enable RLS without designing and testing least-privilege policies. The currently reported policies on `organizations` and `organization_members` do not provide row protection while RLS is disabled.

### Security Advisor snapshot

- Marketing OS: 7 RLS-enabled/no-policy findings; 26 authenticated-executable SECURITY DEFINER findings.
- CEO Back Office: 8 RLS-enabled/no-policy findings; 2 policy/RLS-disabled findings; 34 authenticated-executable SECURITY DEFINER findings; 17 anon-executable SECURITY DEFINER findings; 5 mutable search_path findings; leaked-password-protection advisory.
- Advisor findings are not evidence of exploitation. Function and table scope must be individually reviewed.

### Workspace RPC observations

- `ensure_default_workspace()` exists on both Development branches, is SECURITY DEFINER, is executable by authenticated, and has behavior that selects the first membership / creates a personal workspace. Do not invoke it. No-default-workspace source guard passing does not remove the direct RPC exposure.
- `create_workspace(text)`: a CEO Back Office auth.uid() NULL guard was observed; the Marketing OS Development function was previously observed without that guard. Recheck exact definitions before proposing changes.
- `marketing_security.workspace_mapping_attestations` is absent from the Development databases.
- No dedicated non-BYPASSRLS Tenant A/B audit identity is ready. The current SQL connector role is privileged and cannot serve as Tenant A/B acceptance evidence.

## Remediation matrix — proposed, not executed

| ID | Scope | Proposed remediation | Preconditions | Acceptance evidence |
|---|---|---|---|---|
| ACL-01 | Both Development DBs; table-level TRUNCATE/MAINTAIN grants | Inventory each table, owner, grantor, role, privilege and dependency. Classify app-owned, platform-owned and operational tables. Remove broad API-role privileges only from reviewed targets; do not bulk-revoke. | Backup attestation; ACL snapshot; owner/dependency review; isolated restore; rollback rehearsal | Re-query effective privileges; confirm API roles have no unintended TRUNCATE/MAINTAIN; regression tests; signed review |
| ACL-02 | Both Development DBs; public default ACL | Inventory each `pg_default_acl` entry by owner/grantor, object type, grantee and privilege. Replace broad defaults with explicit least-privilege defaults for reviewed roles. | ACL-01 inventory; object ownership review; migration/restore test | Re-query default ACL; create disposable test object in isolated restore and verify inheritance; delete test object only in restore |
| RLS-01 | CEO Back Office: profiles, organizations, organization_members, standards | Design policies by owner/member/admin role and workspace/org relationship; only then enable RLS; consider FORCE RLS after evaluating privileged/owner behavior | Policy design; FK and membership dependency map; isolated restore; application test plan | Anonymous, signed-in, owner, member, admin and cross-tenant negative tests |
| RLS-02 | Both Development DBs; RLS enabled/no-policy findings | Determine whether each table is intentionally private, operational, service-only or API-exposed. Add narrowly scoped policies or remove API exposure; do not invent permissive policies | Table classification and data owner sign-off | Advisor recheck plus policy matrix and negative access tests |
| RPC-01 | `ensure_default_workspace()` on both Development DBs | Disable/remove public API execution or replace with an explicit workspace-selection flow after dependency review; no automatic first-workspace behavior | Call-site inventory; migration recovery; rollback plan; app contract tests | Direct RPC deny; explicit workspace selection tests; no implicit fallback |
| RPC-02 | Marketing OS `create_workspace(text)` | Add an auth guard and ownership/role checks in a reviewed Development migration | Exact function definition; auth test harness; restore/rollback | no-session deny; signed-in allow only as policy permits; unauthorized deny |
| RPC-03 | SECURITY DEFINER functions and mutable search_path | Review each function's purpose, owner, search_path, authorization checks, grants and referenced tables; pin search_path where appropriate; restrict EXECUTE only after call-site testing | Function inventory and dependency map; least-privilege audit identity; isolated restore | Function-specific positive/negative tests; catalog recheck; regression suite |
| MAP-01 | Workspace Mapping Registry | Build server-owned registry with independent owner attestations, scope, expiry, revocation, nonce/replay controls and audit trail | Independent Auth contexts for both owners; secure key/secret handling; schema acceptance | signed/verified evidence; expired/revoked/replay deny; audit log evidence |
| TEN-01 | Read-only Adapter / Tenant A and B | Keep adapter fail-closed until mapping and RLS/RPC gates pass; test source and target independently; no credential reuse | Dedicated non-BYPASSRLS identity; isolated tenant fixtures; owner consent | A→A and B→B allow; A→B and B→A deny; no-session, expired, revoked, replay and cache-isolation deny |
| PRE-01 | Vercel Preview | Build/deploy the exact approved PR SHA to protected Preview; do not alter Production env or aliases | Billing blocker resolved by team owner; exact-SHA deployment authorization; safe env | deployment SHA verified; authenticated preview access; logs; screenshots |
| UI-01 | Approved UX/UI V4 | Visual/interaction compare against approved reference at desktop and mobile sizes | Authenticated Preview and test accounts | Desktop 1536×1024 and mobile 390×844 evidence; KPI continuity, login, navigation and interaction checks |

## Proposed safe sequence

1. Confirm migration failure root cause and exact branch scope; collect migration ledger, error log and dependency inventory.
2. Create and verify a backup/attestation for the intended Development scope; perform PostgreSQL 17 isolated restore and rollback rehearsal. Do not treat `with_data=false` branch state as a backup.
3. Run ACL-01/02 inventory and prepare reviewed, non-executable proposals. Preserve explicit object ownership and platform dependencies.
4. Remediate in isolated Development only, one small migration at a time, after preconditions and owner approval; validate privilege and RLS behavior after each.
5. Review RPC-01/02/03, then establish owner-attested Mapping Registry.
6. Run Tenant A/B and Read-only Adapter acceptance with a dedicated non-BYPASSRLS identity.
7. Only after Vercel Preview is available, complete exact-SHA authenticated visual and interaction acceptance.

## Rollback / stop conditions

- Stop if project/branch IDs are ambiguous, backup integrity is unverified, restore cannot be completed, or a migration's preconditions are not satisfied.
- Stop if a proposed privilege revocation breaks a platform-owned object, migration, scheduled job, or approved application call.
- Stop if any test unexpectedly permits cross-tenant access, implicit workspace selection, unauthenticated access, or bypasses the mapping lifecycle.
- Rollback must restore the reviewed privilege/policy/function state from the captured snapshot; never use a broad reverse grant or blanket policy to recover.
- Production changes, Cross-project application-data Read, PR merge and release cutover remain out of scope.

## Current release disposition

- Cross-project application-data Read: **OFF**
- Production mutation: **LOCKED**
- PR merge: **NOT AUTHORIZED / NOT DONE**
- Supabase SQL execution: **NONE**
- Tenant A/B runtime: **UNVERIFIED**
- Authenticated Preview / UX/UI V4 visual acceptance: **UNVERIFIED / BLOCKED**
- Release: **NOT PRODUCTION COMPLETE**
