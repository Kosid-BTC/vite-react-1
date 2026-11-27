# PDCA refresh — CEO AI Thailand Marketing OS — 2026-11-27 04:34 ICT

**Disposition:** Development-only evidence refresh. No Production mutation. Cross-project application-data Read remains OFF.

## SCOPE / ACCEPTANCE — both boundaries mandatory
1. **READY FOR USE** means Approved UX/UI V4 is actually running on Production AND all post-deploy gates pass. Deployment/Vercel READY alone is NOT sufficient.
2. **UX/UI CONFIRMATION** is mandatory: authenticated live Production at Desktop 1536x1024 and Mobile 390x844 must be compared against ONLY the two locked 2026-09-20 uploads and `apps/marketing-os/APPROVED_UI_V4_SOURCE.md`, including structural/order assertions.

## LOCKED UX/UI REFERENCES
- `0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg` — primary Overview.
- `4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg` — detailed Dashboard/campaign content.
- Source contract was read from `release/marketing-os-production` at blob `f9aaaa596c324738199d4e66b2aa80d84c3b32b3`.
- Recorded image hashes remain `db7bbd69b7646d4a81156c6c6b01d83a4f107302fd94fb3601ff02994f8fa2c6` and `609493e33900606862e9e73c413ddf2b9d10b32600a957b20d58351a9d56d738`; the actual image bytes were not re-read in this run. No generated mockup or alternate reference was used.
- Contract: light canvas, violet, CEO AI Thailand, left sidebar, topbar/search/profile, six KPI cards, analytics/performance before AI actions, Business Genome, MIT 24 Steps, activity/integration/status, responsive hierarchy. Metrics without evidence remain `—`, `UNAVAILABLE`, or `UNVERIFIED`; no numeric values are copied from the reference images.

## Exact source / release refs
- PR #17 merged. Approved candidate `c6e0552e47578834fd6443fc7762b29b780b8f33`; merge `536d928ca6ad94a3fcb2d388f6cd83350d634fed`.
- Release base `release/marketing-os-production`: `03dde0cc195dd16f863199f4bb9ea77b27302051`. Its current workflow is push-triggered and lacks the protected manual release gate; do not push/merge to it while authoritative.
- PR #20 head `9c13f93697260acd443718ef607825f4712bc10a`, OPEN/DRAFT. Exact Full Non-Production Gate run `45594129156` PASS; local authenticated Visual QA run `45594129227` PASS with artifact `15011089699`. These are disposable-local checks, not Production acceptance.
- PR #20 Preview run `45594129284` and deployed visual run `45594129192` fail closed at deployment. Exact-SHA authoritative Preview deployment count remains zero; Vercel logs report team billing/payment reactivation required. No billing change was made.
- Production deployment metadata: `dpl_7WSDaycLq8vhWy8JbnFLy3rzzSvj`, merge SHA `536d928ca6ad94a3fcb2d388f6cd83350d634fed`, READY. Direct live URL access was not available in this run; authenticated runtime and live visual acceptance remain UNVERIFIED.
- The temporary Vercel share-link fetch path was not used; no share link was created.

## PR #24 exact-head CI
Before this evidence commit, PR #24 head was `d630c4a225a0d49633941b76b1eaa5d5094828b6`. Fresh exact-head runs:
- Cross-project Read Guard `45888717828`: PASS.
- No-default-workspace Guard `45888717919`: PASS.
- Offline CEO Back Office Contract `45888717814`: PASS.
These are source/static/offline/typecheck/build checks, not authenticated live Tenant A/B or cross-project data-flow acceptance.

## PLAN — Development migration / log / data-contract evidence
- Development ref `roprejhnhoaqlctltwfs`, branch `dev-marketing-mapping-attestation`, status `MIGRATIONS_FAILED`, `with_data=false`; child ref is not returned as a standalone project by `get_project`, so branch metadata and catalog queries are the evidence source.
- Direct migration ledger diff: Development 55 records; Production 48. Development-only recovery entries: 10. Production-only versions missing in Development: `20261116014116`, `20261116014321`, `20261120130606`.
- Historical migration errors on 2026-11-16: SQLSTATE `42P01` dependent DDL referenced `public.workspaces` before it existed; `3F000` cron scheduling ran before schema `cron` existed; `P0002` seller seed strict lookup found no canonical workspace/brand. These are the recovery root causes; no remote replay/repair was run.
- Catalog-only Development counts: canonical workspace 0; brand 0; audience segment 0; business types 0; segment-business-type links 0; campaigns 0; content items 0; tracking links 0; evidence 0; cron jobs 0; mapping-attestation schema/table absent. No seed data was fabricated.
- Current SQL audit principal is `postgres`, `BYPASSRLS=true`, `CREATEDB/CREATEROLE/REPLICATION=true`, row_security on. It is not a least-privilege Tenant A/B identity.
- The last-24h Postgres ERROR log slice contained 9 audit-query errors (SQLSTATEs `42P01`, `42703`, `42803`); the query strings identify these as management API audit/catalog queries using mismatched table/column assumptions, not application-runtime or migration replay evidence. A corrected read-only count query passed. No migration was executed in this run.

## CHECK — security / performance / integration
- Development Security Advisor: 7 RLS-enabled/no-policy findings and 26 authenticated-executable SECURITY DEFINER functions. Health Advisor: no lints. Performance Advisor: 69 unindexed FK findings, 7 auth-RLS initplan warnings, 31 unused indexes, 17 multiple-permissive-policy findings, and 1 Auth connection-strategy info item.
- Production Supabase `bjozpwdtqbpwcxnqguka`: ACTIVE_HEALTHY; Health Advisor no lints. Security debt remains: 7 RLS-enabled/no-policy tables, `pg_net` in public, 26 authenticated-executable SECURITY DEFINER functions, leaked-password protection disabled. Production Auth/RLS/Security settings were not changed.
- Integration contract remains source/static only: seller `evidence_status='hypothesis'`; aliases `employee → sidebiz`, `growth → owner`; food/palm are business types. One-way Back Office → Marketing OS data flow, owner-attested workspace mapping, Landing Page/Attribution live E2E and authenticated Tenant A/B/RLS/RPC remain BLOCKED/UNVERIFIED. Cross-project application-data Read stays OFF.

## DO — safe actions this run
- Read-only fresh audit and exact-head CI checks.
- No remote Development migration repair, seed, DDL/DML, reset/rebase, cross-project read, Production deploy, alias change, or Production security/auth mutation.
- This file is documentation evidence only; it does not certify live integration or release.

## ACT — root-cause register / next
1. **Vercel billing:** restore team payment status before exact-SHA Preview/deployed visual gates.
2. **Migration drift:** 10 Development-only recovery entries vs 3 Production-only versions; isolate semantic collision/dependency analysis, backup integrity, PostgreSQL 17 restore and rollback parity before remote repair.
3. **Missing canonical seed:** workspace/brand/taxonomy prerequisites remain absent; never fabricate.
4. **Least-privilege audit identity:** provision and attest a non-BYPASSRLS read-only role; then authenticated Tenant A/B negative/positive tests.
5. **Mapping:** owner attestation, expiry/revocation/replay prevention and identity mapping must be verified before enabling the adapter.
6. **Release:** PR #20 must remain Draft until exact-SHA Preview and deployed visual gates pass and the manual/protected release workflow is reviewed.

**Overall: NO-GO / NOT PRODUCTION COMPLETE.**
