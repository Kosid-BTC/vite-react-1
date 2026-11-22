# CEO AI Thailand Marketing OS — live gate snapshot (2026-11-22)

**Verdict: NO-GO / NOT PRODUCTION COMPLETE.** This is a read-only evidence snapshot. No Production mutation, cross-project application read, merge, deploy, database DDL, restore or cutover was performed.

## GitHub PR lineage
- PR #23: OPEN, DRAFT, not merged. Head `fix/marketing-os-dual-db-security-gates` at `94a49e3a5ed81e472a277e2227f18255299684c7`; base `fix/marketing-os-release-gates-v5` at `f7263085138c58cdda7f3ebe2f63f023b200d277`. No PR-triggered workflow run returned for this head SHA.
- PR #24: OPEN, DRAFT, not merged. Head `feat/marketing-os-ceo-backoffice-intelligence-contract` at `06af01bab77365edfeb94b62fa7c17b93d98692a`; base `fix/marketing-os-release-gates-v5` at `f7263085138c58cdda7f3ebe2f63f023b200d277`. Workflow 44717001160 passed one offline-contract job: locked dependency install, offline mapping/evidence contract and explicit workspace fail-closed regression. This is not runtime integration.
- PR #30: OPEN, DRAFT, not merged. Head `fix/marketing-dev-audit-role-preflight-20261122` at `5a7de9322c2686aec0fdd72b44ee0d4cb1ae09ae`; base `fix/marketing-schema-audit-preflight-20261120` at `bd234a4b97f1a7a98cb729b3f420bd53220f44ec`. Compare reports 7 commits ahead, 0 behind. PR #30 is a diagnostics branch; it is not a merge of PR #23/#24 feature branches.
- Workflow 44977357756 passed offline-guards and isolated-restore-smoke jobs. The latter created a disposable network-disconnected PostgreSQL 17 and restored a **data-free synthetic fixture**, then asserted RLS. This is not an actual project backup, production-data restore, Auth restore, or tenant A/B test.

## Supabase Development-only evidence
- CEO dev branch `dev-backoffice-rls-hardening`, ref `tdeuyycqbbktacmxgktn`: branch status `FUNCTIONS_DEPLOYED`, `with_data=false`, preview `ACTIVE_HEALTHY`. Status does not prove full migration parity.
- Marketing dev branch `dev-marketing-mapping-attestation`, ref `roprejhnhoaqlctltwfs`: branch status `MIGRATIONS_FAILED`, `with_data=false`, preview `ACTIVE_HEALTHY`.
- Both inspected MCP sessions are `postgres`, `rolsuper=false`, `rolcreatedb=true`, `rolcreaterole=true`, `rolbypassrls=true`. They are not acceptable least-privilege principals for tenant isolation certification.
- Marketing Development security advisor snapshot: 7 RLS-enabled public tables with no policies; 26 authenticated-callable SECURITY DEFINER functions. These require object-by-object intent review; no blanket policy or grant changes.
- CEO Development security advisor snapshot: 2 tables have policies while RLS is disabled; 8 RLS-enabled tables have no policies; 5 functions have mutable search_path; 17 SECURITY DEFINER functions are callable by anon. Review each object individually; no blanket remediation.
- Marketing Development `migration_audit.identity_mapping_registry` and `migration_audit.workspace_mapping_registry` both resolve to NULL (not deployed). Proposed SQL remains in Git only.

## Vercel
- Exact-SHA Preview queries returned zero deployment records for PR #23, PR #24 and PR #30 heads.
- Latest five deployments for `ceo-ai-marketing-os` included READY deployment `dpl_6hmFzFVNhu6XCRPeK8a1Xq6ce4zW` on SHA `f7263085138c58cdda7f3ebe2f63f023b200d277` (PR #22 merge), not any current PR #23/#24/#30 head.
- Therefore authenticated Preview and Approved UX/UI V4 Desktop/Mobile remain UNVERIFIED.

## Gates
| Gate | Status |
|---|---|
| Offline source/contract guard CI for PR #24 | PASS |
| Offline guard + synthetic PostgreSQL 17 restore smoke for PR #30 | PASS (synthetic only) |
| PR #23 CI | UNVERIFIED (no run returned) |
| Supabase Development migration readiness | FAIL (Marketing branch MIGRATIONS_FAILED) |
| Least-privilege audit credential | FAIL (both inspected sessions BYPASSRLS) |
| Semantic RLS/RPC review | FAIL / incomplete (advisor findings above) |
| Owner-attested Identity/Workspace Mapping | UNVERIFIED |
| Actual Backup Attestation + isolated restore | UNVERIFIED |
| Read-only Adapter runtime integration | UNVERIFIED |
| Authenticated Tenant A/B non-BYPASSRLS tests | UNVERIFIED |
| Exact-SHA Authenticated Preview + UX/UI V4 | UNVERIFIED |
| Production Acceptance | NOT PASS |

## Required next steps
1. Obtain an independently provisioned least-privilege audit principal and verify direct and inherited privileges before any tenant test.
2. Investigate actual failed Development migration statement/log; reconcile CEO and Marketing dev migration histories; capture authorized backups/checksums and perform isolated PostgreSQL 17 restore before DDL.
3. Complete owner-signed identity/workspace mapping, per-object RLS/RPC review, Tenant A/B tests, read-only adapter integration and exact-SHA authenticated Preview before separate Production cutover approval.

**No Production changes, no cross-project application reads, no merges, no deployments, no migration DDL and no cutover.**
