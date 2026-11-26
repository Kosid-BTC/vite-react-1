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