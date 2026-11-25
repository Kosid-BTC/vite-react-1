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

## Recovery blockers

- Marketing OS Development branch status is `MIGRATIONS_FAILED`; do not apply any migration until its failure is diagnosed from the actual migration ledger and a verified backup/isolated-restore/rollback package exists.
- CEO Back Office Development branch status is `FUNCTIONS_DEPLOYED`; this does not establish schema parity or security acceptance.
- Both branches have `with_data=false`; do not treat that as backup or restore evidence.
- Dedicated non-BYPASSRLS audit identity, independent owner consent verification, RLS/RPC runtime tests, and Tenant A/B tests remain UNVERIFIED.

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
