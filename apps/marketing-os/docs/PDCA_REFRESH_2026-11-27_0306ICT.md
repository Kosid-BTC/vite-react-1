# CEO AI Thailand Marketing OS — PDCA Refresh 2026-11-27 03:06 ICT

**Disposition: NOT PRODUCTION COMPLETE.** Development-only metadata review. Cross-project application-data Read remains OFF. Production remains LOCKED. No application rows were read and no SQL/DDL/DML was applied.

## GitHub snapshot

- PR #24: OPEN / DRAFT / UNMERGED. Audited head before this document commit: `c98bc88fafce0874132faa407fe6f72d1db0e70e`.
- PR #23: OPEN / DRAFT / UNMERGED. Head: `52c06743242ccc4dbf52f085acea02d1869c478a`.
- Compare #23 -> #24: DIVERGED, 137 ahead / 7 behind; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- PR #24 exact-head workflows (GitHub API): Cross-project Read Guard run `45885236578` PASS; No-default-workspace Guard `45885236975` PASS; Offline CEO Back Office Contract `45885236633` PASS. Jobs and steps returned completed/success for all steps. Static/offline checks only.
- PR #23 Cross-project Read Guard run `45020906804` PASS (previous exact head).

## Supabase Development-only catalog review

Projects: Marketing OS Development `roprejhnhoaqlctltwfs`; CEO Back Office Development `tdeuyycqbbktacmxgktn`. Catalog SQL was read-only and limited to PostgreSQL catalog metadata. The SQL session was `postgres` (BYPASSRLS=true); this is not a valid Tenant A/B audit identity.

### Branch status
- CEO Back Office branch `dev-backoffice-rls-hardening`: `FUNCTIONS_DEPLOYED`, `with_data=false`.
- Marketing branch `dev-marketing-mapping-attestation`: `MIGRATIONS_FAILED`, `with_data=false`.
- Preview DB status is ACTIVE_HEALTHY for both branches; that does not prove migration recovery.

### Workspace RPC
- Both branches expose `public.ensure_default_workspace()` as SECURITY DEFINER, owner postgres, authenticated EXECUTE true, anon EXECUTE false. It selects the earliest membership and creates a personal workspace if none exists. **Do not invoke.**
- Both expose `create_workspace(text)` as SECURITY DEFINER and authenticated EXECUTE.
- Marketing OS `create_workspace(text)` lacks an explicit `auth.uid() IS NULL` guard in the catalog definition reviewed.
- CEO Back Office `create_workspace(text)` includes an explicit null-auth guard.

### RLS / policies
- Marketing OS: seven tables RLS enabled, zero policies: `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, `youtube_quota`. FORCE RLS is false.
- CEO Back Office: RLS disabled on `profiles`, `organizations`, `organization_members`, `standards`; `organizations` and `organization_members` each have a policy while RLS is disabled. Eight additional tables were observed with RLS enabled and no policies. FORCE RLS is false.

### Effective table privilege metadata (catalog query)
- Marketing OS: `anon` has MAINTAIN, REFERENCES, TRIGGER, TRUNCATE effective privileges on 36 tables; `authenticated` has those same four on 36 tables and SELECT on 1 table. Service-role grants were also observed on 44 tables for MAINTAIN/REFERENCES/TRIGGER/TRUNCATE and narrower DML/SELECT counts.
- CEO Back Office: `anon` has MAINTAIN, REFERENCES, TRIGGER, TRUNCATE on 31 tables; `authenticated` has these on 62 tables plus SELECT on 31 and DML on subsets (INSERT 19, UPDATE 17, DELETE 17). Service-role privilege counts include MAINTAIN/REFERENCES/TRIGGER/TRUNCATE on 66 tables.
- Default ACL catalog entries were observed for owners `supabase_admin` and `postgres`, including API-role grants for table/function/schema object classes. Do not bulk-revoke; review each owner/object, grantor, API path, dependencies, and platform-managed objects before a change.
- These counts establish catalog privilege metadata only; they do not establish an exploit, API exposure path, or successful data access.

### Mapping
- `marketing_security.workspace_mapping_attestations` remains absent from both Development databases.
- Owner verification, dual-owner consent, expiry/revocation, replay prevention, and per-read authorization remain UNVERIFIED.
- No dedicated non-BYPASSRLS audit identity is available.

### Security Advisor snapshot
- CEO Back Office: 2 policies with RLS disabled; 8 RLS/no-policy; 5 mutable search_path; 17 anon-executable SECURITY DEFINER; 34 authenticated-executable SECURITY DEFINER; leaked-password protection disabled.
- Marketing OS: 7 RLS/no-policy; 26 authenticated-executable SECURITY DEFINER.
- Findings require per-object remediation review; counts alone do not justify blanket revocation.

## Vercel

Authoritative project `ceo-ai-marketing-os`, ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`, team `team_oryw9VGF4TLakA4qBU6pGx43`. Exact-SHA deployment lookup for the audited PR #24 head returned zero deployments. Branch lookup for the PR branch also returned zero. Latest visible project deployment is READY on older SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target null. This is not an authenticated Preview acceptance.

## Gates / next actions

1. Backup attestation, PostgreSQL 17 isolated restore, schema parity, migration dependency/collision analysis, and rollback evidence.
2. Review effective grants/default ACL object-by-object; prepare Development-only RLS/RPC remediation with rollback and preconditions.
3. Establish owner-attested mapping, non-BYPASSRLS test identity, Tenant A/B negative and positive tests, read-only adapter E2E, authoritative exact-SHA Preview, and UX/UI V4 visual acceptance (desktop 1536x1024 and mobile 390x844).

No Production mutation, cross-project application-data read, or SQL/DDL/DML occurred in this audit.
