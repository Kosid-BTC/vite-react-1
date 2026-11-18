# Production schema-only dump — protected attestation gate (NOT APPROVED)

Status: **FAIL CLOSED / NOT RUN**. This is an evidence checklist, not permission to connect to Production.

## Preconditions (all mandatory)
1. Protected GitHub Environment `marketing-schema-audit`, reviewed exact workflow SHA, required reviewers and branch restriction. No untrusted PR code with secrets.
2. Inspect only the **name and metadata** of `MARKETING_PROD_SCHEMA_READONLY_URL`. Never print URI, credentials, env contents or dump. Verify real effective privileges including role membership, owner powers, and object privileges. Reject SUPERUSER, CREATEDB, CREATEROLE, BYPASSRLS, any direct/inherited write, CREATE, ALTER or ownership power. `SELECT` on customer rows is not acceptable for this audit; prefer an approved metadata-only path.
3. Record PostgreSQL server major, `pg_dump` major (17 required), Docker engine and immutable container image digest. Verify the dump has **no table rows** and excludes `COPY` data, INSERT data and customer secrets.
4. Obtain independent, read-only Production catalog inventories: functions (definitions and SECURITY DEFINER), owners, raw ACL, effective privileges by `anon`, `authenticated`, `service_role`, role memberships, default privileges, tables, columns, indexes, constraints, policies, triggers, extensions, storage policies, cron metadata and dependency graph. Do not publish sensitive definitions.
5. Review every SQL source for JWT/credentials, Vault calls, network references, FDW, subscriptions, cron jobs, external execution and unsafe `SECURITY DEFINER` behavior. Scanner PASS alone is insufficient; require manual attestation and explicit approval of a 64-character lowercase SHA-256 over **the exact captured bytes**.
6. Verify SQL semantics independently. Normalizing CRLF, whitespace, or function bodies is NOT proof of equivalent PostgreSQL semantics. Compare parsed statements, literal/function-body contents, grants and catalog effects in an isolated test.
7. Pre-provision a compatible **disposable PostgreSQL 17 / Supabase-like** target with verified roles and extensions; block external networking. No customer data, no Production secrets, no production endpoints.
8. Restore only after all checks above PASS; use `ON_ERROR_STOP=1`, bounded readiness and cleanup on every path. No automatic replay of recovered migrations, especially quarantined credential-bearing SQL.
9. Compare source and restored inventories with deterministic, complete object identity and owner/effective-grant parity. Treat missing role, extension, permission, object, dependency or metadata as FAIL, not ignored drift. Record only redacted diffs and hashes.
10. Run negative and positive RLS/tenant isolation tests with synthetic Tenant A/B, anonymous, member, owner/admin, and service-role fixtures. Verify rollback fingerprints. No Production Auth/RLS/Security modification.

## Existing workflow blocker
`.github/workflows/marketing-schema-parity-manual.yml` currently captures `--no-owner --no-privileges`, so its restored database **cannot** prove Ownership or Grants parity. `PARITY_INVENTORY_READONLY.sql` also lacks full dependency/effective-privilege coverage. **Do not dispatch this workflow as a Full Parity certification.** The manual workflow must be redesigned and independently reviewed before a secret-bearing run.

## Evidence required to lift hold
- Reviewed exact workflow commit and reviewer decision
- Least-privilege role and effective privilege attestation (no secret values)
- Production metadata inventory fingerprint
- Exact dump SHA-256 and redacted scanner/manual review
- PostgreSQL 17 isolated restore log, no customer data, no outbound network
- Full source/restored object and owner/effective-grants diff
- Tenant isolation/security regression and rollback proof
- Exact release SHA CI and authenticated Production desktop/mobile visual acceptance

Any missing item: **BLOCKED / NOT PRODUCTION COMPLETE**.
