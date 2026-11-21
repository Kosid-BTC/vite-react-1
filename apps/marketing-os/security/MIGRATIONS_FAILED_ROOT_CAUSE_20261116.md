# Development migration diagnosis — evidence update 2026-11-22

## Status
Supabase Development branch `dev-marketing-mapping-attestation` (project `roprejhnhoaqlctltwfs`) is still reported `MIGRATIONS_FAILED` by the branch API. This is **not** evidence that the five objects listed in the 2026-11-16 diagnosis remain absent.

## Verified current facts (read-only SQL against Development)
All five objects previously described as missing are **present now**:
- `public.marketing_brands`
- `public.marketing_campaigns`
- `public.marketing_content_items`
- `public.can_edit_workspace(uuid)`
- `public.is_member(uuid)`

The 2026-11-16 root-cause report was a time-specific snapshot and **must not be used as a current repair instruction**. Presence does not establish definition/owner/grant/RLS equivalence, nor does it clear the branch's `MIGRATIONS_FAILED` state.

Additional read-only inventory confirmed that `workspaces`, `workspace_members`, `workspace_state`, `marketing_audience_segments`, `marketing_business_types` and `marketing_segment_business_types` exist and have RLS enabled. The two business-type tables currently have zero RLS policies. Do not assume that is a defect; investigate intended deny-by-default design and RPC access.

The actual Development MCP session is `postgres`, with `CREATEDB=true`, `CREATEROLE=true`, `BYPASSRLS=true`. The committed `DEV_AUDIT_ROLE_PREFLIGHT_READONLY.sql` returned `audit_preflight_pass=false`. That session is not valid for least-privilege or authenticated Tenant A/B acceptance.

## Remaining unknowns / gates
1. Obtain exact failed migration version, SQL statement, and server error from branch logs, not from the migration status label alone.
2. Compare tracked migration SQL semantics and live object definitions, ownership, grants, policies, constraints and dependencies. Do not reapply migrations based on a filename or presence check.
3. Attest the exact credential used by the protected audit environment, including inherited/settable roles and write privileges; do not print credentials. The MCP `postgres` session does not prove that the protected CI environment has the same role.
4. Capture an approved schema-only backup with verified owner/grant inventory and perform an isolated PostgreSQL 17 restore, with rollback and full parity evidence. Existing schema parity workflow intentionally fails closed.
5. Only then prepare and apply the smallest reviewed patch in **Development**, run integration using real non-BYPASSRLS authenticated Tenant A/B sessions, and validate owner-attested workspace mapping without selecting the first workspace.
6. Verify the target Vercel project against the **same exact release SHA** with authenticated Desktop 1536x1024 and Mobile 390x844 evidence.

## Change control
No Production Auth/RLS/Security modifications, no Cross-project Read, no branch reset, no migration replay, no merge, and no deployment are authorized by this diagnostic document.

**NO-GO — NOT PRODUCTION COMPLETE** until independent evidence passes every gate.
