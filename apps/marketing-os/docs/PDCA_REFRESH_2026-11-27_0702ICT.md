# CEO AI Thailand Marketing OS — PDCA checkpoint (2026-11-27 07:02 ICT)

## Scope and safety
- Development metadata/catalog-only audit; no application rows read.
- No SQL/DDL/DML, migration replay, reset/rebase, owner consent fabrication, or Production mutation.
- Cross-project application-data Read remains OFF; Production LOCKED.

## GitHub exact evidence
- PR #24 latest pre-audit head: `85541f7fe8076f27061c3cb57448c235ea6d8a1b` (OPEN/DRAFT/UNMERGED).
- PR #23: `52c06743242ccc4dbf52f085acea02d1869c478a` (OPEN/DRAFT/UNMERGED).
- Compare PR #23 head → PR #24 head: DIVERGED, ahead 141 / behind 7; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- PR #24 exact-head CI at `85541f7...`: Cross-project guard run 45911928859 PASS; offline contract run 45911928869 PASS; no-default-workspace run 45911928899 PASS. Job and step summaries verified. These are static/offline/typecheck/build checks, not live integration or Tenant A/B tests.
- Combined Vercel status SUCCESS points to legacy `usrt-btc/ceoaimk`, not the authoritative project.

## Supabase Development branches
- Marketing OS: parent `bjozpwdtqbpwcxnqguka`; branch `dev-marketing-mapping-attestation`; branch ID `e2139d78-2675-4863-ac64-a5fad7c8f826`; project ref `roprejhnhoaqlctltwfs`; `MIGRATIONS_FAILED`; preview `ACTIVE_HEALTHY`; `with_data=false`.
- CEO Back Office: parent `waigsnxhrlwtiotspaim`; branch `dev-backoffice-rls-hardening`; branch ID `2172c0d4-e534-4fe8-918e-5c99ad35ae45`; project ref `tdeuyycqbbktacmxgktn`; `FUNCTIONS_DEPLOYED`; preview `ACTIVE_HEALTHY`; `with_data=false`.
- Branch listing and migration metadata were read successfully. No application rows were read.

## Catalog-only security findings
- Marketing Development: seven public tables have RLS ON, FORCE RLS OFF, and no policy: `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, `youtube_quota`.
- CEO Back Office Development: `organizations` and `organization_members` each have one policy while RLS is OFF. Eight tables have RLS ON and no policies: `ai_usage`, `checkup_leads`, `client_errors`, `founding_members`, `handoff_nonces`, `landing_funnel`, `quickcheck_submissions`, `referrals`.
- Security Advisor: Marketing — 7 RLS/no-policy, 26 authenticated-executable SECURITY DEFINER. Back Office — 2 policy/RLS-disabled, 8 RLS/no-policy, 5 mutable search_path, 17 anon-executable SECURITY DEFINER, 34 authenticated-executable SECURITY DEFINER, and leaked-password protection disabled.
- Both Development branches: `ensure_default_workspace()` and `create_workspace(text)` are SECURITY DEFINER, owned by postgres, EXECUTE granted to authenticated, not anon. Do not invoke `ensure_default_workspace()`; it selects an implicit first membership and may create a personal workspace.
- `marketing_security.workspace_mapping_attestations` is absent on Marketing Development.
- Catalog roles: anon/authenticated BYPASSRLS=false; postgres/service_role/supabase_read_only_user BYPASSRLS=true. No dedicated non-BYPASSRLS audit identity is ready.
- Default ACL catalog: public table defaults include MAINTAIN, REFERENCES, TRIGGER and TRUNCATE for anon/authenticated/service_role, entries under grantors postgres and supabase_admin. This is a default-ACL risk requiring object/platform-owner review; no bulk revoke was attempted.

## Vercel
- Authoritative project `ceo-ai-marketing-os`: `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`, team `team_oryw9VGF4TLakA4qBU6pGx43`.
- Exact-SHA deployment lookup for PR #24 head `85541f7...`: zero deployments.
- Latest visible authoritative deployment remains READY on old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target null.
- Exact-head combined Vercel status is SUCCESS but belongs to legacy project `usrt-btc/ceoaimk`; it is not authoritative Preview acceptance.

## Mapping / Adapter / Acceptance
- Mapping registry, trusted owner verification, expiry/revocation/replay enforcement: UNVERIFIED.
- Tenant A/B authenticated tests using non-BYPASSRLS identity: BLOCKED.
- Live Read-only Adapter E2E: UNVERIFIED.
- Authenticated authoritative Preview: BLOCKED.
- Approved UX/UI V4 authenticated desktop 1536x1024 and mobile 390x844 evidence: UNVERIFIED.

## Next gates
1. Backup attestation, PostgreSQL 17 isolated restore, migration semantic parity and rollback proof.
2. Review default ACL/object grants and RLS/RPC per object in Development only after recovery preconditions.
3. Trusted dual-owner mapping, non-BYPASSRLS Tenant A/B, adapter E2E, authoritative exact-SHA authenticated Preview, and visual acceptance.

**NO-GO — NOT PRODUCTION COMPLETE.** Cross-project application-data Read remains OFF; Production remains LOCKED.

## Additional effective TRUNCATE privilege audit (catalog-only)
- Marketing Development: effective `TRUNCATE` privilege is true for `anon` and `authenticated` on 36 public base tables each (36 distinct tables per role).
- CEO Back Office Development: effective `TRUNCATE` privilege is true for `anon` on 31 public base tables and for `authenticated` on 62 public base tables.
- This privilege is not protected by row-level policies; it is a high-priority privilege review finding. Do not assume the REST API exposes TRUNCATE directly; assess RPC/role paths and platform-managed ACL origin before remediation.
- No TRUNCATE, REVOKE, DDL/DML, or application-row read was performed. Keep the finding scoped to Development metadata and remediate only after backup/restore/rollback preconditions.
