# Development gate refresh — 2026-11-26

**Scope:** read-only audit of PR #23/#24, Supabase Development branch metadata/migration ledgers/Security Advisor, and authoritative Vercel deployment metadata. This note is documentation-only. No SQL/DDL/DML, function deployment, Cross-project application-data Read, merge, Vercel configuration change, or Production mutation was performed.

## Exact GitHub refs at audit time

- PR #24: OPEN / DRAFT / UNMERGED; head before this audit-note commit: `0c920d32528b0a313e4a1536445c2d3ea3018e1f`; API reports mergeable=true.
- PR #23: OPEN / DRAFT / UNMERGED; head `52c06743242ccc4dbf52f085acea02d1869c478a`; API reports mergeable=true.
- PR #24 exact-head PR workflows at `0c920d3...`: Offline CEO Back Office Contract run `45712231561` PASS; No-default-workspace Guard run `45712231404` PASS; Cross-project Read Guard run `45712231344` PASS.
- PR #23 exact-head Cross-project Read Guard run `45020906804` PASS.
- These checks are source/static/offline contracts and do not establish owner attestation, authenticated Tenant A/B, live RLS/RPC isolation, or Read-only Adapter E2E.
- Both PRs remain draft and unmerged.

## Supabase Development branch metadata

The correct Development targets are the branch project refs, not their parents.

| Environment | Parent project | Development project ref | Branch ID | Branch status | Preview DB status | With data |
|---|---|---|---|---|---|---|
| Marketing OS | `bjozpwdtqbpwcxnqguka` | `roprejhnhoaqlctltwfs` | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `MIGRATIONS_FAILED` | `ACTIVE_HEALTHY` | false |
| CEO Back Office | `waigsnxhrlwtiotspaim` | `tdeuyycqbbktacmxgktn` | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `FUNCTIONS_DEPLOYED` | `ACTIVE_HEALTHY` | false |

Both branches are non-default/non-persistent and have `with_data=false`. This is not backup or isolated-restore evidence.

## Migration ledger refresh

Read-only `list_migrations` results:

| Environment | Records | Latest version | Latest migration |
|---|---:|---|---|
| Marketing OS Development | 55 | `20261116022351` | `dev_restore_pg_cron_extension_for_behavior_maintenance` |
| CEO Back Office Development | 77 | `20261116022248` | `dev_fixture_for_data_dependent_marketing_seed` |

The Marketing OS branch status remains `MIGRATIONS_FAILED`; a migration ledger alone does not establish healthy replay or schema parity. No migration was applied.

## Fresh Security Advisor findings (Development only)

| Finding | Marketing OS Development | CEO Back Office Development |
|---|---:|---:|
| RLS enabled without policies | 7 | 8 |
| Policies exist while RLS is disabled | 0 | 2 |
| Authenticated-executable SECURITY DEFINER | 26 | 34 |
| Anon-executable SECURITY DEFINER | 0 | 17 |
| Mutable function search_path | 0 | 5 |
| Leaked-password protection advisory | Not returned | 1 |

These are Advisor findings, not proof of exploitability. Review the intended table access, authorization logic, call paths, ownership and grants before remediation. The CEO Back Office Development Advisor continues to flag `public.ensure_default_workspace()` as executable by authenticated; prior catalog evidence records implicit-first-workspace behavior. Do not invoke it or rely on it for workspace selection.

## Vercel authoritative project and exact SHA

- Project: `ceo-ai-marketing-os`; ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`; team `team_oryw9VGF4TLakA4qBU6pGx43`.
- SSO protection is enabled.
- Exact-SHA deployment lookup for `0c920d32528b0a313e4a1536445c2d3ea3018e1f` returned zero deployments.
- The latest visible authoritative deployment is READY on older SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target `null`; it is not an authenticated Preview for the PR candidate.
- A previous Preview deployment attempt was blocked by HTTP 402 `resource_creation_blocked` due to the team's overdue balance/valid payment-method prerequisite. This audit did not retry deployment or change billing.
- Exact-SHA authenticated Preview and Approved UX/UI V4 desktop/mobile visual acceptance remain UNVERIFIED.

## Acceptance disposition

- Trusted owner verification and dual-owner consent: UNVERIFIED.
- Workspace Mapping Registry runtime, expiry, revocation, replay prevention: UNVERIFIED.
- Dedicated non-`BYPASSRLS` audit identity: NOT READY.
- RLS/RPC runtime and Tenant A/B positive/negative tests: UNVERIFIED.
- Read-only Adapter E2E: UNVERIFIED.
- Authenticated exact-SHA Preview: UNVERIFIED/BLOCKED.
- Approved UX/UI V4 visual acceptance (1536x1024 and 390x844): UNVERIFIED.
- Cross-project application-data Read: OFF.
- Production: LOCKED.

**NOT PRODUCTION COMPLETE.**

## Fresh evidence refresh — 2026-11-26 08:47 ICT

This section supersedes stale deployment and branch references above. Read-only checks were performed against the current Development branch and authoritative Vercel project. No Production mutation, Development DDL/DML, migration, deployment, seed, or Cross-project application-data Read was performed.

### Exact refs and workflows
- PR #24 current head before this evidence commit: `a86051b800db1562c39edabfcb4f8737d426d97e`, OPEN / DRAFT / UNMERGED.
- Exact-head workflow runs: Cross-project Read Guard `45726795931` PASS; No-default-workspace Guard `45726795947` PASS; Offline CEO Back Office Contract `45726795937` PASS. Static/offline checks only.
- PR #20 current head `9c13f93697260acd443718ef607825f4712bc10a`: PR-triggered Actions lookup and combined status returned no current checks; authoritative exact-SHA deployment lookup returned 0.
- PR #34 current head `08a6ec4138393c1592c354eba0e61b3a7980c659`: exact-head Actions lookup returned 0; combined Vercel status is on legacy `ceoaimk`, not the authoritative project; exact-SHA deployment lookup returned 0.
- PR #33 current head `25347a2eee9deb384f62299f4bb6d80cacad5892`: explicit-workspace guard run `45407817007` PASS. PR #30 run `44992687838`, PR #31 run `45152600055`, and PR #32 run `45290896419` are exact-head PASS. These do not prove remote tenant isolation or live integration.

### Supabase Development — fresh direct read
- Marketing OS Development ref `roprejhnhoaqlctltwfs`, branch ID `e2139d78-2675-4863-ac64-a5fad7c8f826`, status `MIGRATIONS_FAILED`, preview status `ACTIVE_HEALTHY`, `with_data=false`.
- Migration ledger remains 55 entries; Production ledger 48; Development has 10 `dev_recover_*` entries and 3 Production-only migration versions absent in Development.
- Read-only counts: workspaces 0, brands 0, audience segments 0, business types 0, segment/business-type links 0, campaigns 0, content items 0, tracking links 0, evidence 0, cron jobs 0.
- `marketing_security.workspace_mapping_attestations` is absent.
- Current SQL connector session is `postgres`: `rolsuper=false`, `rolbypassrls=true`, `rolcreatedb=true`, `rolcreaterole=true`, `rolreplication=true`. It is not a least-privilege Tenant A/B identity.
- Security Advisor: 7 RLS-enabled tables without policies; 26 authenticated-executable SECURITY DEFINER functions. Health Advisor empty. No Development PostgreSQL ERROR rows returned in the queried 24-hour window.
- No canonical workspace/brand/seller rows were fabricated. No remote migration or seed was applied.

### Supabase Production — unchanged
- Production ref `bjozpwdtqbpwcxnqguka`: Health Advisor empty.
- Security Advisor: 7 RLS-enabled tables without policies; `pg_net` in public; 26 authenticated-executable SECURITY DEFINER functions.
- No Production Auth/RLS/Security settings or data changed.

### Vercel / Production runtime evidence
- Authoritative Production deployment remains `dpl_7WSDaycLq8vhWy8JbnFLy3rzzSvj`, SHA `536d928ca6ad94a3fcb2d388f6cd83350d634fed`, metadata READY.
- Latest authoritative Preview deployment remains `dpl_6hmFzFVNhu6XCRPeK8a1Xq6ce4zW`, old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target null.
- No Preview for current PR #20 or #34 candidates. Exact candidate deployment lookups returned 0.
- Current runtime error query (24h) and Production error/fatal log query (30m) returned no records. This does not establish direct homepage/login HTTP success or authenticated runtime.
- Direct Production homepage and login were not freshly verified through the web-access path; therefore HTTP/runtime smoke is UNVERIFIED. Earlier exact candidate logs recorded the Vercel overdue-balance `DEPLOYMENT_DISABLED` blocker; no billing change was made.

### Acceptance
- READY FOR USE: NOT PASS — approved UX/UI V4 is not freshly verified on live Production and all post-deploy gates are not complete.
- UX/UI CONFIRMATION: UNVERIFIED — no authenticated Production screenshots at 1536x1024 and 390x844; no structural/order assertions from live Production.
- Owner attestation, mapping registry runtime/expiry/revocation, dedicated non-BYPASSRLS identity, backup integrity, PostgreSQL 17 isolated restore, rollback parity, authenticated Tenant A/B, one-way Landing Page/Attribution E2E, and exact-SHA authoritative Preview remain BLOCKED/UNVERIFIED.
- Cross-project application-data Read remains OFF. Production remains LOCKED.

**NO-GO / NOT PRODUCTION COMPLETE.**
