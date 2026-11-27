# Development branch scope and recovery status — 2026-11-26

## Supabase control-plane verification

The correct lookup for Supabase Development branches is `list_branches` on the parent project. A `get_project` call using a branch project ref returns `Project not found`; that response alone does not establish that the branch is absent.

Fresh `list_branches` results:

| Environment | Parent project | Development branch | Branch ID | Branch status | Preview DB status | With data |
|---|---|---|---|---|---|---|
| Marketing OS | `bjozpwdtqbpwcxnqguka` | `roprejhnhoaqlctltwfs` | `e2139d78-2675-4863-ac64-a5fad7c8f826` | `MIGRATIONS_FAILED` | `ACTIVE_HEALTHY` | `false` |
| CEO Back Office | `waigsnxhrlwtiotspaim` | `tdeuyycqbbktacmxgktn` | `2172c0d4-e534-4fe8-918e-5c99ad35ae45` | `FUNCTIONS_DEPLOYED` | `ACTIVE_HEALTHY` | `false` |

Both branches are non-default and non-persistent. The parent project refs are branch-parent metadata; they are not the Development target refs.

## Scope defect found and contained

At the prior PR #24 head, the owner-attestation and RPC proposal files used the parent project refs as their target identifiers. If those proposals had been applied to a parent project, they could have changed the wrong database. No SQL, DDL, DML, migration, or Edge Function deployment was executed.

Containment committed to PR #24:

- All three SQL proposal files remain comment-only; every non-empty line starts with `--`, so accidental SQL execution is a no-op.
- The design templates now pin their target identifiers to the verified Development branch refs above and record the branch IDs and status.
- Static verifiers require comment-only files and the exact branch refs/IDs.
- The dormant supplementary URL in the application boundary now points to the CEO Back Office Development branch, not its parent project.
- The adapter still returns `WORKSPACE_MAPPING_UNVERIFIED` and makes zero target network/database calls.

## Development migration and Security Advisor snapshot

Read-only branch migration ledgers:

| Environment | Migration records | Latest version | Latest migration |
|---|---:|---|---|
| Marketing OS Development | 55 | `20261116022351` | `dev_restore_pg_cron_extension_for_behavior_maintenance` |
| CEO Back Office Development | 77 | `20261116022248` | `dev_fixture_for_data_dependent_marketing_seed` |

Security Advisor findings (Development branches only):

| Finding | Marketing OS Development | CEO Back Office Development |
|---|---:|---:|
| RLS enabled without policies | 7 | 8 |
| Policies exist while RLS is disabled | 0 | 2 |
| Authenticated-executable SECURITY DEFINER functions | 26 | 34 |
| Anon-executable SECURITY DEFINER functions | 0 | 17 |
| Mutable function search_path | 0 | 5 |
| Leaked-password protection advisory | Not returned | 1 |

These are advisor/catalog findings, not proof that each object is exploitable. Review each function, table, grant, and service call path before remediation. No ACL, RLS, function, or migration changes were applied.

## Exact-SHA CI and Vercel Preview

PR #24 branch head at this audit: `1176c948df888f97e03e854e57f6642cb55615d1`.

- Offline CEO Back Office Contract — run `45711805965` PASS.
- No-default-workspace Guard — run `45711806313` PASS.
- Cross-project Read Guard — run `45711806088` PASS; job steps include the approved UX/UI V4 source contract, Marketing OS typecheck, and full build using offline placeholder Supabase environment variables.
- PR #23 head remains `52c06743242ccc4dbf52f085acea02d1869c478a`; Cross-project Read Guard run `45020906804` PASS.

These checks establish source/static/offline contracts and a placeholder-environment build. They do not establish database runtime, authenticated Tenant A/B, or visual acceptance.

Vercel:

- Authoritative project: `ceo-ai-marketing-os`, ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`.
- SSO protection is enabled.
- Exact-SHA deployment lookup for `1176c948df888f97e03e854e57f6642cb55615d1` returned zero deployments.
- A Preview-only deployment request for that exact SHA was rejected by Vercel with HTTP 402 `resource_creation_blocked`: team has an overdue balance and must add a valid payment method. No deployment was created.
- Latest visible deployment remains READY on old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target `null`; it is not an authenticated Preview for this candidate.

## Recovery blockers

- Marketing OS Development branch status is `MIGRATIONS_FAILED`; do not apply any migration until its failure is diagnosed from the actual migration ledger and a verified backup/isolated-restore/rollback package exists.
- CEO Back Office Development branch status is `FUNCTIONS_DEPLOYED`; this does not establish schema parity or security acceptance.
- Both branches have `with_data=false`; do not treat that as backup or restore evidence.
- Dedicated non-BYPASSRLS audit identity, independent owner consent verification, RLS/RPC runtime tests, and Tenant A/B tests remain UNVERIFIED.
- Authenticated exact-SHA Preview is blocked by Vercel team billing; no billing or project settings were changed.

## Release disposition

- Trusted owner verification: UNVERIFIED
- Workspace Mapping runtime: UNVERIFIED
- RLS/RPC runtime and Tenant A/B: UNVERIFIED
- Read-only Adapter E2E: UNVERIFIED
- Authenticated exact-SHA Preview: UNVERIFIED
- Approved UX/UI V4 visual acceptance: UNVERIFIED
- Cross-project application-data Read: OFF
- Production: LOCKED

**NOT PRODUCTION COMPLETE.**
