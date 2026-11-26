# PDCA Refresh — 2026-11-27 02:35 ICT

## Scope / acceptance

1. **READY FOR USE** means Approved UX/UI V4 is actually running on Production and all post-deploy gates pass. Vercel deployment READY alone is not sufficient.
2. **UX/UI CONFIRMATION is mandatory:** compare live Production with ONLY the two locked 2026-09-20 user-uploaded references and `apps/marketing-os/APPROVED_UI_V4_SOURCE.md`, using authenticated Desktop 1536×1024 and Mobile 390×844 evidence plus structural/order assertions.

## Locked visual sources

- `0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg` — primary overview; SHA-256 `db7bbd69b7646d4a81156c6c6b01d83a4f107302fd94fb3601ff02994f8fa2c6`.
- `4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg` — detailed Dashboard/campaign content; SHA-256 `609493e33900606862e9e73c413ddf2b9d10b32600a957b20d58351a9d56d738`.

The source contract preserves the light canvas, violet accent, CEO AI Thailand branding, sidebar/topbar/search/profile, six KPI cards, performance/analytics before AI actions, Business Genome, MIT 24 Steps, activity/platform status and mobile hierarchy. Unverified metrics remain `—`, `UNAVAILABLE`, or `UNVERIFIED`; do not reproduce numeric reference-image values.

## PLAN — current read-only findings

- Development branch ref: `roprejhnhoaqlctltwfs`; branch name `dev-marketing-mapping-attestation`; branch status remains `MIGRATIONS_FAILED`; preview status reported `ACTIVE_HEALTHY`; no data-bearing branch.
- Development migration ledger: 55 entries. Production ledger: 48 entries. Three Production migration versions are absent from Development (`20261116014116`, `20261116014321`, `20261120130606`) and ten Development-only recovery entries are present. This is ledger evidence, not proof of semantic parity.
- Development tables verified in the catalog: workspaces, marketing brands, audience segments, business types, segment-business-type links, campaigns, content items, tracking links, evidence and cron job table. The actual content relation is `marketing_content_items`; `public.marketing_content` does not exist.
- Read-only counts: canonical `ceo-ai-thailand` workspace 0; brands 0; segments 0; business types 0; segment-business-type links 0; campaigns 0; content items 0; tracking links 0; evidence 0; active cron jobs 0.
- `marketing_security.workspace_mapping_attestations` is absent. Cron catalog table exists, but there are no active scheduled jobs.
- SQL connector audit identity is `postgres`, with `BYPASSRLS=true`. This is not a least-privilege tenant-isolation audit principal.
- Development security advisor: seven RLS-enabled/no-policy findings and 26 authenticated-executable SECURITY DEFINER functions; `pg_net` remains in `public`. These findings require review, not blind remediation.
- Development catalog-only and log queries were read-only. The latest bounded log query returned no records; this does not establish successful migration/runtime behavior.

## DO — minimum safe actions

- No remote migration replay, seed, DDL/DML, reset, rebase, merge or risky SQL was applied.
- No Production Supabase Auth/RLS/Security setting was changed.
- No workspace, brand, seller, business-type or mapping record was fabricated.
- This refresh records evidence only; it does not claim to repair the remote Development branch.

## CHECK — data-contract and acceptance gates

| Gate | Status | Evidence |
|---|---|---|
| Seller remains hypothesis | Static/source contract only | No live seed rows |
| `employee → sidebiz` | Static/source contract only | No live segment rows |
| `growth → owner` | Static/source contract only | No live segment rows |
| Food/palm are business types | Static/source contract only | No live taxonomy rows |
| Explicit workspace binding | Static/source contract only | No canonical workspace |
| One-way Back Office → Marketing OS | BLOCKED/UNVERIFIED | Cross-project application-data read remains OFF |
| Landing Page / Attribution | Static/local verification only | No remote campaign/content/evidence rows |
| Authenticated E2E | BLOCKED/UNVERIFIED | No dedicated non-BYPASSRLS identity |
| Tenant A/B RLS/RPC isolation | BLOCKED/UNVERIFIED | Audit credential and attestation registry unavailable |
| Locked UX/UI V4 Production visual | BLOCKED/UNVERIFIED | Authoritative Vercel Preview unavailable |

## ACT — root causes and next corrective action

1. Migration divergence and failed recovery history require backup-integrity attestation, PostgreSQL 17 isolated restore, ownership/effective-grant parity and rollback rehearsal before any replay.
2. The canonical workspace/brand and taxonomy are absent; seed remains fail-closed until the recovery preconditions are proven. Do not fabricate rows.
3. A dedicated least-privilege, non-BYPASSRLS audit identity and authenticated Tenant A/B negative/positive tests remain prerequisites.
4. Owner-attestation registry (independent contexts, expiry, revocation, replay prevention) remains unverified.
5. Cross-project data reads remain OFF until attestation, isolation and runtime gates pass.
6. Production remains locked. No promotion or security weakening.

## Release / visual status

PR #20 exact candidate `9c13f93697260acd443718ef607825f4712bc10a` remains draft. Its Full Non-Production Gate and authenticated local visual QA pass, but exact-SHA Preview and deployed visual gates fail closed because the Vercel team reports an overdue balance; no deployed screenshot artifacts exist. Production remains on merge `536d928ca6ad94a3fcb2d388f6cd83350d634fed` metadata READY, but live/authenticated acceptance and locked-reference parity are unverified.

## Delta

Read-only migration/catalog/advisor evidence refreshed, content relation name clarified, counts and root causes recorded. No remote Development repair and no Production mutation.