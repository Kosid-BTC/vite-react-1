# CEO AI Thailand Marketing OS — Development Gate Refresh
**Evidence time:** 2026-11-26T10:06:40Z (ICT 17:06:40)
**Scope:** GitHub PR metadata/Actions, Supabase Development branch metadata/migrations/tables/Security Advisor, and authoritative Vercel project/deployment metadata.

## Safety boundary
- Cross-project application-data Read: OFF.
- Production: LOCKED.
- No merge, Production mutation, SQL/DDL/DML, migration, seed, function deployment, or Vercel deployment was performed in this audit.
- Supabase table inspection was metadata-only (table names, RLS flags, aggregate row counts); no application rows were queried.
- No target application-data was read through the cross-project adapter.

## GitHub exact refs
- Repository: `Kosid-BTC/vite-react-1`.
- PR #24: OPEN / DRAFT / UNMERGED; API `mergeable=true`; head at audit start `674edba9173239cc6a71908bfdb116ecce32ef7b`; base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- PR #23: OPEN / DRAFT / UNMERGED; API `mergeable=true`; head `52c06743242ccc4dbf52f085acea02d1869c478a`.
- Compare PR #23 head → PR #24 head: DIVERGED, PR #24 ahead 127 / behind 7; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`. Do not merge wholesale.

## Exact-head GitHub Actions
PR #24 head `674edba9173239cc6a71908bfdb116ecce32ef7b`:
- Cross-project Read Guard run `45780218474` — PASS. Job steps: locked dependency install; no-cross-project-read guard; explicit workspace own-property validation; supplementary adapter fail-closed; Approved UX/UI V4 source contract; TypeScript typecheck; Marketing OS offline-placeholder full build. Every reported step completed successfully.
- No-default-workspace Guard run `45780218815` — PASS. Job step rejecting implicit first-workspace RPC callsites completed successfully.
- Offline CEO Back Office Contract run `45780218478` — PASS. Dual-owner attestation, offline mapping/evidence, explicit workspace regression, and static Development-only SQL/RPC proposal checks completed successfully.
PR #23 head `52c06743242ccc4dbf52f085acea02d1869c478a`:
- Cross-project Read Guard run `45020906804` — PASS. This is a source-level guard only.
These are source/static/offline/typecheck/build checks, not proof of trusted owner identity, live mapping registry, authenticated Tenant A/B, live RLS/RPC isolation, or Read-only Adapter E2E.

## Supabase Development branch discovery
Branch refs must be resolved by listing branches on the parent project. A direct `get_project` call against a branch project ref returns NotFound; that alone does not mean the branch is absent.

| Environment | Parent project | Development ref | Branch ID | Branch status | Preview DB | with_data |
|---|---|---|---|---|---|---|
| Marketing OS | `bjozpwdtqbpwcxnqguka` | `roprejhnhoaqlctltwfs` | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `MIGRATIONS_FAILED` | `ACTIVE_HEALTHY` | false |
| CEO Back Office | `waigsnxhrlwtiotspaim` | `tdeuyycqbbktacmxgktn` | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `FUNCTIONS_DEPLOYED` | `ACTIVE_HEALTHY` | false |

Both are non-default, non-persistent branches. `with_data=false` is not backup, restore, or rollback evidence. Parent projects were used only to discover branch metadata; no parent Production database was modified.

## Migration inventory (read-only)
- Marketing OS Development: 55 migration records; latest `20261116022351 / dev_restore_pg_cron_extension_for_behavior_maintenance`. Branch remains `MIGRATIONS_FAILED`.
- CEO Back Office Development: 77 migration records; latest `20261116022248 / dev_fixture_for_data_dependent_marketing_seed`. Branch status `FUNCTIONS_DEPLOYED` does not prove schema parity or security acceptance.

## Fresh Development Security Advisor and table metadata
Advisor observation timestamps:
- Marketing OS: `2026-11-26T10:06:38.145Z`.
- CEO Back Office: `2026-11-26T10:06:40.113Z`.

| Finding | Marketing OS Development | CEO Back Office Development |
|---|---:|---:|
| RLS enabled / no policy | 7 | 8 |
| Policies exist / RLS disabled | 0 | 2 |
| Authenticated-executable SECURITY DEFINER | 26 | 34 |
| Anon-executable SECURITY DEFINER | 0 | 17 |
| Mutable function search_path | 0 | 5 |
| Leaked-password protection advisory | Not returned | 1 |
| Public tables listed | 44 | 66 |
| Tables with RLS disabled in table metadata | 0 | 4 |

Marketing OS RLS-enabled/no-policy tables:
- `marketing_behavior_batches`
- `marketing_behavior_config`
- `marketing_behavior_limits`
- `marketing_business_types`
- `marketing_segment_business_types`
- `youtube_projects`
- `youtube_quota`

CEO Back Office tables with RLS disabled:
- `public.profiles`
- `public.organizations`
- `public.organization_members`
- `public.standards`

CEO Back Office tables with policies but RLS disabled:
- `public.organizations`
- `public.organization_members`

CEO Back Office RLS-enabled/no-policy tables:
- `public.ai_usage`
- `public.checkup_leads`
- `public.client_errors`
- `public.founding_members`
- `public.handoff_nonces`
- `public.landing_funnel`
- `public.quickcheck_submissions`
- `public.referrals`

The Development Advisor also reports 26 Marketing authenticated-executable SECURITY DEFINER functions and 17 CEO Back Office anon-executable plus 34 authenticated-executable SECURITY DEFINER functions. These are findings requiring function-by-function grant, owner, search_path, authorization, and call-path review; they do not alone prove exploitability. Do not bulk-revoke or enable RLS without reviewed table-specific policies and dependency tests.

The `marketing_security.workspace_mapping_attestations` registry table was not present in either Development table listing. `ensure_default_workspace()` remains reported as executable by authenticated in the Development Security Advisor. Do not invoke it. No dedicated non-`BYPASSRLS` Tenant A/B audit identity has been evidenced.

## Vercel authoritative project
- Project: `ceo-ai-marketing-os`.
- Project ID: `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`.
- Team ID: `team_oryw9VGF4TLakA4qBU6pGx43`.
- SSO protection: enabled; password protection: disabled.
- Exact-SHA deployment lookup for PR #24 head `674edba9173239cc6a71908bfdb116ecce32ef7b`: **0 deployments**.
- Latest visible deployment: `dpl_6hmFzFVNhu6XCRPeK8a1Xq6ce4zW`, state READY, old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target `null`. It is not the PR #24 authenticated Preview.
- PR #24 combined GitHub Vercel status is `success`, but its target is under legacy `usrt-btc/ceoaimk`, not the authoritative project. Do not treat it as candidate Preview acceptance.
- A previous Preview attempt was blocked by HTTP 402 `resource_creation_blocked` due to team billing. Billing was not rechecked or changed in this audit; no deployment was retried.

## Acceptance disposition
- PR #24 exact-head source/static/offline CI: PASS 3/3.
- PR #23 source guard: PASS (one historical exact-head run).
- Marketing OS Development migration recovery: FAIL / `MIGRATIONS_FAILED`.
- CEO Back Office Development RLS-disabled tables and RPC/SECURITY DEFINER findings: remediation required.
- Trusted owner verification and dual-owner consent: UNVERIFIED.
- Workspace Mapping registry runtime, expiry, revocation, replay prevention: UNVERIFIED.
- Dedicated non-`BYPASSRLS` audit identity: NOT READY / NOT EVIDENCED.
- Authenticated Tenant A/B and live RLS/RPC tests: UNVERIFIED / NOT RUN.
- Read-only Adapter E2E: UNVERIFIED; keep fail-closed.
- Authoritative exact-SHA Authenticated Preview: unavailable; 0 deployments for candidate.
- Approved UX/UI V4 source contract: PASS in CI; desktop 1536×1024 and mobile 390×844 visual acceptance: UNVERIFIED.
- Cross-project application-data Read: OFF.
- Production: LOCKED.

**NO-GO / NOT PRODUCTION COMPLETE.**


## Additional Development cron/function review — 2026-11-26

Read-only inspection of the CEO Back Office Development branch `tdeuyycqbbktacmxgktn` identified an operational issue outside the Marketing OS schema migration:

- Active cron job `billing-cron-daily`, schedule `0 2 * * *`, posts to the literal URL `https://<PROJECT_REF>.functions.supabase.co/billing-cron` and sends the literal header value `<CRON_SECRET>`.
- Active cron job `weekly-report-friday`, schedule `0 2 * * 5`, posts to `https://<PROJECT_REF>.functions.supabase.co/weekly-report`; its header reads `current_setting('app.cron_secret', true)`.
- PostgreSQL log at `2026-11-26T02:00:00.063Z` records `invalid URL "https://<PROJECT_REF>.functions.supabase.co/billing-cron": Bad hostname`. This is a confirmed failed request from the Development cron job, not a successful function invocation.
- Edge Function inventory shows `billing-cron` ACTIVE version 47 and `weekly-report` ACTIVE version 33; both have `verify_jwt=false`.
- Source inspection shows both functions read `CRON_SECRET` with an empty-string fallback and only reject a request when the configured secret is non-empty and mismatched. If the secret is absent, this guard fails open. Actual secret presence/value was not inspected and remains UNVERIFIED.
- The billing function uses the service-role client and can update subscription state; the weekly report function reads workspace data and sends email. Neither function was invoked. No secret was read, rotated, or changed; no cron job was modified.

Marketing OS Development PostgreSQL logs in the same 24-hour window contain three errors attributable to audit SELECT statements issued through the management API: a missing `public.brands` relation, a missing `public.campaigns` relation, and a query using a nonexistent `information_schema.routines.schema_name` column. The logged SQL text and `mgmt-api` / `POST /mcp` source identify these as audit-query errors, not proof of new application migration failures. Marketing OS branch status nevertheless remains `MIGRATIONS_FAILED`.

**Required next action:** keep both Development cron jobs unchanged until the Development owner approves a controlled correction. Confirm the correct branch-specific function URL, verify the secret is configured without disclosing its value, make the function return 503/deny when the secret is absent, and test in an isolated branch before updating any scheduled job. Do not copy these placeholder URLs or secrets to Production.
