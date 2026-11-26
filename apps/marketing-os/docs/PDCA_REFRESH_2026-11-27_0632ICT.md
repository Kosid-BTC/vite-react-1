# CEO AI Thailand Marketing OS — PDCA checkpoint (2026-11-27 06:32 ICT)

## Scope / acceptance — mandatory boundaries
1. **READY FOR USE** means Approved UX/UI V4 is actually running on Production AND all post-deploy gates pass. Deployment/Vercel READY alone is not sufficient.
2. **UX/UI CONFIRMATION** is mandatory: compare live Production against only the two locked user-uploaded references from 2026-09-20 and `apps/marketing-os/APPROVED_UI_V4_SOURCE.md`, with authenticated Desktop 1536x1024 and Mobile 390x844 evidence plus structural/order assertions.

## Locked UX/UI references
- `0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg` — primary Marketing OS overview.
- `4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg` — detailed Dashboard/campaign-content.
- Source contract: `apps/marketing-os/APPROVED_UI_V4_SOURCE.md`.

Contract: light canvas, violet accent, CEO AI Thailand branding, left sidebar, topbar/search/profile, six KPI cards, analytics/performance before recommendations, Business Genome, MIT 24 Steps, activity/platform areas, responsive/mobile hierarchy. Metrics remain evidence-only (`—`, `UNAVAILABLE`, `UNVERIFIED`); no reference-image numbers are copied.

## PLAN — current evidence
- PR #17 candidate `c6e0552e47578834fd6443fc7762b29b780b8f33`, merge `536d928ca6ad94a3fcb2d388f6cd83350d634fed`.
- PR #20 exact head `9c13f93697260acd443718ef607825f4712bc10a`, OPEN/DRAFT.
- PR #24 exact head before this documentation commit `5ae96dc8ac198166733bf9fa73ee4577978e2798`, OPEN/DRAFT.
- PR #34 exact head `08a6ec4138393c1592c354eba0e61b3a7980c659`, OPEN/DRAFT.
- Development branch `dev-marketing-mapping-attestation` remains `MIGRATIONS_FAILED`; preview status ACTIVE_HEALTHY; no data.
- Production migration ledger 48 entries; Development 55 entries (10 recovery entries; 3 Production-only migrations missing from Development).
- Development read-only audit session is `postgres`, `BYPASSRLS=true`, `CREATEDB/CREATEROLE/REPLICATION=true`; it is not a least-privilege Tenant A/B identity.
- Development current 24-hour Postgres ERROR query returned no records after correcting the read-only log query to match the log schema.

## DO — minimum safe work
Documentation-only checkpoint; no application code, migration, seed, DDL/DML, reset/rebase, cross-project application-data read, Vercel configuration, or Production mutation.

## CHECK — Development data / mapping / integration
Read-only counts remain zero for workspaces, brands, seller hypothesis segments, business types, segment-business-type associations, campaigns, content items, tracking links and evidence. Cron schema is present but active cron jobs = 0. Mapping-attestation tables are absent.

Static contract checks remain fail-closed for seller as hypothesis, aliases `employee → sidebiz` and `growth → owner`, food/palm as business types, explicit workspace binding and no-default-workspace. Static PASS is not live integration acceptance.

- One-way Back Office → Marketing OS: BLOCKED / UNVERIFIED.
- Landing Page / Attribution live integration: UNVERIFIED.
- Authenticated Tenant A/B and RLS/RPC isolation using a non-BYPASSRLS identity: BLOCKED / UNVERIFIED.
- Owner attestation / expiry / revocation / replay protection: BLOCKED / UNVERIFIED.
- Authenticated Production E2E and locked-reference Desktop/Mobile parity: UNVERIFIED.

## Exact-SHA gates
- PR #20 Full Non-Production Gate run 45594129156: PASS.
- PR #20 local authenticated visual QA run 45594129227: PASS.
- PR #20 authoritative Preview run 45594129284: FAIL at Vercel deployment.
- PR #20 deployed visual gate run 45594129192: FAIL at deployment; no deployed screenshots.
- PR #34 Full Non-Production Gate run 45529824938: PASS.
- PR #34 local authenticated visual QA run 45529824879: PASS.
- PR #34 deployed visual gate run 45529824855: FAIL at deployment; no deployed screenshots.
- PR #24 exact-head guards at head `5ae96dc8ac198166733bf9fa73ee4577978e2798`: cross-project read guard, no-default-workspace guard and offline contract all PASS.

## Vercel / Production
Authoritative project: `ceo-ai-marketing-os`, project ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`. Production alias `ceo-ai-marketing-os.vercel.app` maps to READY deployment `dpl_7WSDaycLq8vhWy8JbnFL3rzzSvj`, SHA `536d928ca6ad94a3fcb2d388f6cd83350d634fed`. The newest project deployment metadata is a Preview/target-null deployment and does not supersede that alias mapping.

Vercel Preview deploy failure is confirmed in exact-SHA logs: team overdue balance/payment reactivation prerequisite. Billing was not changed. Production runtime-error aggregation returned no errors for the selected 24-hour window; request/runtime logs could not be read because retention was unavailable. Authenticated Production smoke and visual parity remain UNVERIFIED. A previous login-page HTTP 200 was recorded at 04:34 ICT; it was not rechecked in this checkpoint.

## Supabase security / health — read-only
Development security advisor: 7 RLS-enabled/no-policy findings and 26 authenticated-executable SECURITY DEFINER functions. Health advisor: no lints. Development performance advisor: 69 unindexed FKs, 7 auth RLS initplan warnings, 31 unused indexes, 17 multiple-permissive-policy findings, 1 absolute Auth connection strategy notice.

Production security advisor: 7 RLS-enabled/no-policy findings, `pg_net` in public schema warning, 26 authenticated-executable SECURITY DEFINER functions and leaked-password protection disabled. Health advisor: no lints. Production performance advisor: 73 unindexed FKs, 9 auth RLS initplan warnings, 24 unused indexes, 19 multiple-permissive-policy findings, 1 absolute Auth connection strategy notice.

## ACT — root cause / next action
1. Vercel billing prevents authoritative Preview and deployed visual evidence.
2. Development migration history remains divergent; backup integrity, PostgreSQL 17 isolated restore, semantic parity and rollback proof are not attested.
3. Workspace/brand prerequisites and mapping data are absent; do not fabricate seed data.
4. Least-privilege non-BYPASSRLS audit identity is unavailable.
5. Owner attestation and live tenant isolation remain unverified.

Next: restore Vercel deployment availability; attest backup/isolated restore/rollback; provision least-privilege audit identity; resolve migration semantics in isolation; then rerun exact-SHA Preview, authenticated Tenant A/B, one-way integration, and Production auth/runtime plus Desktop/Mobile visual gates.

**NO-GO — NOT PRODUCTION COMPLETE.** No Production Supabase Auth/RLS/Security settings changed.
