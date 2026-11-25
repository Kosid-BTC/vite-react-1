# Development project-ref scope blocker — 2026-11-26

## Finding

A fresh Supabase control-plane lookup returned the parent projects below as `ACTIVE_HEALTHY`:

- Marketing OS parent project: `bjozpwdtqbpwcxnqguka` (listed as `CEOAITHAILAND Marketing`)
- CEO AI Thailand parent project: `waigsnxhrlwtiotspaim` (listed as `CEO Ai Thailand`)

The previously designated Development branch refs were `roprejhnhoaqlctltwfs` (Marketing OS Development) and `tdeuyycqbbktacmxgktn` (CEO Back Office Development). A fresh `list_projects` response did not include either ref, and `get_project` returned `Project not found` for both.

The owner-attestation and RPC SQL proposals at the prior PR #24 head embedded the parent-project refs rather than refs that were verified as Development branches. This is a **scope blocker**: applying those proposals as written could target a parent project. No SQL, DDL, DML, migration, or Edge Function deployment was executed in this work round.

## Containment committed to PR #24

- Converted all three SQL proposal files into comment-only design templates. Every non-empty line starts with a SQL comment, so executing the files as SQL is a no-op.
- Removed embedded parent-project refs and replaced them with explicit Development-ref placeholders.
- Updated static verifiers to require comment-only templates, require the placeholders, and reject the previously embedded parent refs.
- Kept the supplementary adapter fail-closed. Cross-project application-data Read remains OFF.

## Recovery required before any executable SQL

1. Restore visibility of the two dedicated Development branches in the correct Supabase organization.
2. Independently verify each branch's exact project ref, parent project ref, branch ID, status, PostgreSQL version, and `with_data` state.
3. Obtain backup integrity, PostgreSQL 17 isolated-restore, schema-parity, and rollback evidence.
4. Review the proposed SQL against the actual Development schemas and a least-privilege, non-BYPASSRLS audit identity.
5. Only then prepare a new executable Development migration and request separate approval before applying it.

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
