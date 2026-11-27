# Marketing OS P0 PDCA Refresh — 2026-11-27 10:58 ICT

**Scope:** Development/source-control evidence only. No merge, Production promotion, Supabase mutation, cross-project data read, or credential access.

## SCOPE / ACCEPTANCE — both boundaries are mandatory

1. **READY FOR USE** means Approved UX/UI V4 is actually running on Production AND all post-deploy gates pass. Vercel/Deployment READY alone is NOT sufficient.
2. **UX/UI CONFIRMATION** requires authenticated live Production comparison against ONLY the two locked 2026-09-20 user uploads and `apps/marketing-os/APPROVED_UI_V4_SOURCE.md`, with Desktop 1536×1024 + Mobile 390×844 screenshots and structural/order assertions.

## LOCKED UX/UI REFERENCES

- `0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg` — primary Marketing OS overview; SHA-256 `db7bbd69b7646d4a81156c6c6b01d83a4f107302fd94fb3601ff02994f8fa2c6`.
- `4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg` — detailed Dashboard/campaign-content; SHA-256 `609493e33900606862e9e73c413ddf2b9d10b32600a957b20d58351a9d56d738`.
- Source contract: `apps/marketing-os/APPROVED_UI_V4_SOURCE.md`.

The original two Library image files were located and inspected. Candidate PR #20 manifest has exactly the two locked filenames and hashes. The release branch manifest still has legacy filenames and a duplicate source entry. Source-byte hashes do not establish live visual parity.

## Exact Git / release refs

- PR #17 historical approved candidate: `c6e0552e47578834fd6443fc7762b29b780b8f33`.
- PR #17 merge / current Production source: `536d928ca6ad94a3fcb2d388f6cd83350d634fed`.
- PR #20 observed pre-refresh head: `b2107e6383a10fda50638f8a09c45b490ed176c1`; OPEN / DRAFT. This is a new candidate and is not covered by PR #17's historical Production approval.
- PR #20 base `release/marketing-os-production`: `03dde0cc195dd16f863199f4bb9ea77b27302051`.

## Vercel / runtime evidence

- Authoritative project: `ceo-ai-marketing-os` / `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`.
- Exact-SHA Preview for observed head `b2107e6383a10fda50638f8a09c45b490ed176c1`: `dpl_8CTyfK8NUYixU581AHvpc8MD3y25`, READY, target Preview, no alias.
- Preview build events: `Using prebuilt build artifacts from .vercel/output`, then `Deployment completed`. This confirms deployment completion only; it is not a fresh CI build or visual acceptance.
- Preview login route returned HTTP 200. Authenticated dashboard, desktop/mobile screenshots, and locked-reference visual parity remain UNVERIFIED.
- Production alias `ceo-ai-marketing-os.vercel.app` maps to `dpl_7WSDaycLq8vhWy8JbnFL3rzzSvj`, READY, merge SHA `536d928ca6ad94a3fcb2d388f6cd83350d634fed`.
- Production protected fetch returned login-page HTTP 200 only; authenticated dashboard and visual parity remain UNVERIFIED.
- Temporary share bypasses used for Production/Preview fetches were revoked; Production alias reports no remaining bypass.
- Runtime error clusters (24h): none. Production and Preview error/fatal runtime logs (30m): none.
- Prior overdue-balance deployment error was not reproduced for this prebuilt Preview deployment. General billing status remains UNVERIFIED; billing-charges API returned 404.

## Exact-SHA CI / visual gates

- Current observed PR #20 head `b2107...`: no exact-head PR workflow run was returned. Combined GitHub status only exposes a legacy `ceoaimk` Vercel check, not authoritative project CI.
- Earlier Full Non-Production Gate and local visual QA PASS on `9c13f93697260acd443718ef607825f4712bc10a` are historical and do not transfer to `b2107...`.
- No deployed Desktop 1536×1024 or Mobile 390×844 screenshot artifact exists for the current observed head.
- Release branch workflow remains push-triggered. PR #20's manual exact-SHA workflow and protected `marketing-os-production` environment are unmerged. Do not push/merge to the release branch while its current workflow is authoritative.

## Supabase / migration / security — read-only

### Development: `roprejhnhoaqlctltwfs`

- Branch `dev-marketing-mapping-attestation`: `MIGRATIONS_FAILED`; Preview project status `ACTIVE_HEALTHY`.
- Migration ledger: Development 55; Production 48; 10 Development-only recovery entries; 3 Production-only migrations absent in Development (`20261116014116`, `20261116014321`, `20261120130606`).
- Canonical workspace `ceo-ai-thailand`: absent. Brand `CEO AI Thailand`: absent.
- Workspaces, brands, audience segments, business types, segment-business-type links, campaigns, content, tracking links and evidence: 0 rows.
- `cron` schema present; 7 cron functions; active jobs 0.
- `marketing_security.workspace_mapping_attestations`: absent.
- SQL audit session is `postgres`, `BYPASSRLS=true`, `CREATEDB/CREATEROLE/REPLICATION=true`; not a least-privilege Tenant A/B identity.
- Last-24h Postgres ERROR/FATAL/PANIC query: no rows.
- Historical migration root causes remain: SQLSTATE 42P01 (workspaces dependency), 3F000 (cron schema ordering), P0002 (strict seller seed prerequisite). No migration replay/repair.

### Production: `bjozpwdtqbpwcxnqguka`

- `ACTIVE_HEALTHY`; PostgreSQL 17.6.1.155; Health Advisor empty.
- Canonical workspace `ceo-ai-thailand` and brand `CEO AI Thailand` exist.
- Six audience segments; seller is `evidence_status='hypothesis'`.
- Business types and segment-business-type links: 0; campaigns/content/tracking/evidence: 0.
- Production security advisor: 7 RLS-enabled tables without policies; 26 authenticated-executable SECURITY DEFINER functions; `pg_net` in public; leaked-password protection disabled.
- Production performance advisor: 73 unindexed FKs; 9 auth RLS initplan warnings; 24 unused indexes; 19 multiple permissive policies.
- No Production Auth/RLS/Security setting changed.

## CEOAITHAILAND → Marketing OS integration

- PR #24 current head `f29ff92fc1967431199353830a5a37d1c94d525b`: exact-head cross-project-read, no-default-workspace and offline-contract workflows PASS. These are static/offline checks only.
- Contract source preserves `employee → sidebiz`, `growth → owner`, seller as hypothesis, and food/palm as business types.
- Supplementary adapter remains fail-closed; no cross-project request is made.
- Newer PR #37 defines the governing API-only scope: approved marketing back-office objects and aggregate metrics only. Explicitly exclude website User/Auth, PII, customer/lead records, user-level events, identity mapping and account write-back.
- Fresh inspection of `Kosid-BTC/CEOAITHAILAND` main confirms `src/App.tsx` and `index.html` are Vite starter-template files. No actual source API, data dictionary/field inventory, or Development machine credential is verified. One-way live flow, Landing Page/Attribution and authenticated E2E remain BLOCKED.

## PLAN / DO / CHECK / ACT

- **PLAN:** Fresh-read PR #17/#20/#24/#34/#36/#37, exact heads, workflows, release branch, Vercel deployment history/events, Supabase migration ledgers, current error logs, advisors, mapping code and CEOAITHAILAND source repository.
- **DO:** The minimum safe locked-reference manifest correction is already in PR #20; do not merge it to the release branch while the push-triggered Production workflow remains active. Keep supplementary adapter disabled. No new code, SQL, seed or Production mutation in this refresh.
- **CHECK:** Exact-head PR #20 CI and deployed visual artifacts for `b2107...` are not verified. PR #24 static/offline gates pass but live integration is blocked. Migration, mapping, tenant, auth and locked-reference Production visual gates remain blocked/unverified.
- **ACT:** Preserve fail-closed behavior; require exact-head Full Gate, authoritative Preview, authenticated deployed visual evidence, Development backup + PostgreSQL 17 isolated restore + rollback parity, least-privilege non-BYPASSRLS audit identity, and API-only source contract before enabling any integration or considering release.

**Decision: NO-GO / NOT PRODUCTION COMPLETE.** No merge, reset, rebase, Production deployment, alias mutation, Supabase DDL/DML, seed, cross-project application-data read, or Production Auth/RLS/Security change.
