# CEO AI Thailand Marketing OS — Development Audit Refresh

**Observed:** 2026-11-26, 21:09 ICT  
**Scope:** Exact PR head CI, Supabase Development metadata/catalog, Vercel authoritative project deployment lookup.  
**Disposition:** Development-only evidence. Cross-project application-data Read OFF. Production LOCKED.

## GitHub exact-head evidence

- PR #24 is OPEN / DRAFT / UNMERGED; head `ff33dad1a7b9c9cc276c23bb4ce0ca19c214022a`; branch `feat/marketing-os-ceo-backoffice-intelligence-contract`; base `fix/marketing-os-release-gates-v5`.
- PR #23 is OPEN / DRAFT / UNMERGED; head `52c06743242ccc4dbf52f085acea02d1869c478a`; branch `fix/marketing-os-dual-db-security-gates`.
- PR #24 → PR #23 compare is DIVERGED: 131 commits ahead / 7 behind; merge base `f7263085138c58cdda7f3ebe2f63f023b200d277`.
- PR #24 exact-head pull_request workflows on `ff33dad...` are all successful:
  - Cross-project Read Guard run `45816269314`.
  - No-default-workspace Guard run `45816269365`.
  - Offline CEO Back Office Contract run `45816269403`.
- Cross-project Read Guard completed Typecheck and offline placeholder Full Build successfully. The guard tests the boundary; it does not execute a live cross-project read or certify runtime tenant isolation.
- PR #23 Cross-project Read Guard run `45020906804` remains previous successful evidence; no new PR #23 run is asserted.

## Supabase Development scope and catalog findings

- Marketing OS Development: project ref `roprejhnhoaqlctltwfs`, branch ID `e2139d78-2675-4863-ac64-a5fad7c8f826`, parent `bjozpwdtqbpwcxnqguka`, status `MIGRATIONS_FAILED`, preview DB `ACTIVE_HEALTHY`, `with_data=false`.
- CEO Back Office Development: project ref `tdeuyycqbbktacmxgktn`, branch ID `2172c0d4-e534-4fe8-918e-5c99ad35ae45`, parent `waigsnxhrlwtiotspaim`, status `FUNCTIONS_DEPLOYED`, preview DB `ACTIVE_HEALTHY`, `with_data=false`.
- Marketing OS migration ledger includes recovery entry `20261116022351`; branch status is still `MIGRATIONS_FAILED`. No migration was applied in this audit.
- Both branches still contain `public.ensure_default_workspace()` as SECURITY DEFINER, owned by postgres, executable by authenticated; its function selects the earliest membership and creates a personal workspace if none exists. Do not invoke.
- Marketing OS `public.create_workspace(text)` lacks the explicit `auth.uid() IS NULL` guard seen in CEO Back Office Development.
- CEO Back Office Development has RLS disabled on `profiles`, `organizations`, `organization_members`, and `standards`. Catalog SELECT privilege checks for anon/authenticated on these four tables returned false; this does not establish that other privileges or call paths are absent.
- Marketing OS Development has 7 RLS-enabled tables with no policy: `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, and `youtube_quota`. Catalog SELECT checks for anon/authenticated returned false for the inspected tables; function/service-role paths remain unverified.
- Supabase Security Advisor snapshot: Marketing OS — 7 RLS/no-policy, 26 authenticated SECURITY DEFINER. CEO Back Office — 2 policy/RLS-disabled, 8 RLS/no-policy, 5 mutable search_path, 17 anon SECURITY DEFINER, 34 authenticated SECURITY DEFINER, and 1 leaked-password-protection advisory.
- `marketing_security.workspace_mapping_attestations` is not present in the Marketing OS Development catalog. Owner verification, dual consent, expiry/revocation/replay protection and mapping runtime remain UNVERIFIED.
- CEO Back Office Cron metadata confirms active schedules `billing-cron-daily` and `weekly-report-friday`; command URLs, secrets and invocation behavior were not inspected or executed during this refresh.
- SQL queries were limited to catalog/function definitions, table privilege metadata, advisor metadata, migration ledger and Cron job metadata. No application rows were read; no RPC was invoked; no DDL/DML or secrets were accessed.

## Vercel authoritative-project evidence

- Project: `ceo-ai-marketing-os`; project ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`; team `team_oryw9VGF4TLakA4qBU6pGx43`; SSO protection enabled.
- Exact-SHA deployment lookup for PR #24 head `ff33dad...` returned zero deployments.
- Exact-SHA deployment lookup for PR #23 head `52c067432...` returned zero deployments.
- Combined GitHub status `Vercel: success` targets legacy project `usrt-btc/ceoaimk`, not the authoritative project.
- Latest visible authoritative deployment is READY on old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target null. It is not an authenticated PR preview.
- No deployment, environment-variable, secret, or Production setting was changed.

## Acceptance gates

- Exact PR #24 Source/Static/Offline/Typecheck/placeholder Build CI: PASS.
- Development migration recovery, backup/restore/rollback: UNVERIFIED/BLOCKED.
- RLS/ACL/RPC remediation: NOT APPLIED.
- Trusted owner verification and attestation registry: UNVERIFIED.
- Dedicated non-BYPASSRLS audit identity: NOT READY.
- Tenant A/B tests and Read-only Adapter live E2E: NOT RUN.
- Authenticated exact-SHA Preview and Desktop 1536x1024 / Mobile 390x844 UX/UI V4 visual acceptance: BLOCKED/UNVERIFIED.
- Cross-project application-data Read remains OFF. Production remains LOCKED. Keep PRs Draft and Unmerged.

**Disposition: NOT PRODUCTION COMPLETE.**
