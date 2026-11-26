# Recovery reconciliation — 2026-11-16

Verified directly via GitHub directory listing: 33 audit-only SQL files in `apps/marketing-os/security/recovered-sql`.

Production `supabase_migrations.schema_migrations` contains 47 entries:
- 34 have nonempty `statements`; 33 recovered into the audit branch.
- 1 is **QUARANTINED**: `20261114080605_marketing_behavior_privacy_defaults`, because the SQL text contains a JWT-like literal. Do NOT commit raw SQL, print token, or replay until secret exposure is assessed and sanitized reconstruction approved.
- 13 have empty `statements`; 9 have matching filename candidates in `supabase/migrations` on main (not yet byte/semantic parity verified). Four have no same-name candidate: `202608240106_marketing_os_compliance_version_scope`, `20260824052557_marketing_os_tracking_lineage`, `20260824075000_harden_marketing_content_ready_authorization`, `20260824081637_harden_marketing_review_audit_identity`.

**Important:** GitHub file names do not prove SQL equivalence. Existing files and recovered SQL must be checked for complete dependency order, schema state and absence of sensitive values. Production migration history can be incomplete even when final schema exists.

## Safety
- `20260819090000_channel_oauth` references Vault; recovered audit copy contains no literal credential identified in the preliminary scan. This is NOT approval to replay it. Use isolated fixtures and no external calls.
- Treat any hardcoded JWT in historical migration as potentially exposed. Investigate token provenance and whether still valid; revoke/rotate via approved operational workflow if needed. Do not publish or transmit token.
- No customer data or Vault secret values should be copied.
- Do not create another paid Supabase branch until a reliable reconstruction mechanism and cost boundary are established.
- Security regression and rollback must remain **NOT RUN** until 47/47 function fingerprints, 42 SECURITY DEFINER counts, all 26 flagged function definitions and effective grants, RLS, triggers, table privileges and dependencies match Production.
- No Production DDL or Auth/RLS/security changes are authorized on these incomplete findings.

Status: RECOVERY PARTIAL; PARITY BLOCKED; TEST DATABASE NOT CREATED.
