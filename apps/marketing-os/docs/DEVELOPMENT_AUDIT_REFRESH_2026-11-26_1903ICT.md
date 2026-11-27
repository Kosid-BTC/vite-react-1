# CEO AI Thailand Marketing OS — Development Audit Refresh
**Observed:** 2026-11-26, approximately 19:03 ICT  
**Scope:** GitHub PRs #24/#23, Supabase Development catalog-only metadata and Security Advisor, Vercel authoritative-project metadata/deployment lookup.  
**Disposition:** DRAFT / DEVELOPMENT ONLY. Cross-project application-data Read OFF. Production LOCKED.

## GitHub
- PR #24: OPEN / DRAFT / UNMERGED; head `58c159d9b97d701afe0ba019bcf073a90365cc43`; branch `feat/marketing-os-ceo-backoffice-intelligence-contract`; base `fix/marketing-os-release-gates-v5`; GitHub API mergeable=true.
- PR #23: OPEN / DRAFT / UNMERGED; head `52c06743242ccc4dbf52f085acea02d1869c478a`; branch `fix/marketing-os-dual-db-security-gates`; base `fix/marketing-os-release-gates-v5`; GitHub API mergeable=true.
- PR #24 latest head has three successful pull_request workflow runs: Cross-project Read Guard `45799125996`, Offline CEO Back Office Contract `45799126042`, No-default-workspace Guard `45799126227`.
- PR #23 head has one verified successful pull_request workflow run in this refresh: Cross-project Read Guard `45020906804`. No additional PR #23 run is asserted.
- PR #24 combined Vercel status is SUCCESS, but its target URL points to legacy `usrt-btc/ceoaimk`, not the authoritative Vercel project. Treat it as non-authoritative.

## Supabase Development Branches
- Marketing OS: parent `bjozpwdtqbpwcxnqguka`; branch ref `roprejhnhoaqlctltwfs`; branch ID `e2139d78-2675-4863-ac64-a5fad7c8f826`; name `dev-marketing-mapping-attestation`; status `MIGRATIONS_FAILED`; preview project `ACTIVE_HEALTHY`; `with_data=false`.
- CEO Back Office: parent `waigsnxhrlwtiotspaim`; branch ref `tdeuyycqbbktacmxgktn`; branch ID `2172c0d4-e534-4fe8-918e-5c99ad35ae45`; name `dev-backoffice-rls-hardening`; status `FUNCTIONS_DEPLOYED`; preview project `ACTIVE_HEALTHY`; `with_data=false`.
- Migration ledger lists Marketing OS failed-recovery entry `20261116022351` (`dev_restore_pg_cron_extension_for_behavior_maintenance`) and Back Office development fixture entry `20261116022248`. Migration status has not been repaired or re-run in this audit.
- No Backup Attestation, isolated restore, schema-parity or rollback evidence was established.

## Catalog-only workspace/RLS observations
- In both Development branches, `public.ensure_default_workspace()` remains SECURITY DEFINER, owner postgres, executable by authenticated, selecting earliest workspace membership and creating a personal workspace when none is found. Do not invoke it.
- CEO Back Office Development `public.create_workspace(text)` checks `auth.uid() IS NULL` and raises SQLSTATE 42501; Marketing OS Development `public.create_workspace(text)` has no such auth guard. No RPC was invoked.
- CEO Back Office catalog query: `profiles`, `organizations`, `organization_members`, and `standards` had RLS disabled. `organizations` and `organization_members` had one policy each; `profiles` and `standards` had none. The catalog privilege check returned anon/authenticated SELECT=false for these four tables. This narrows the exposure assertion to the RLS configuration issue; it does not prove grants for other operations are absent.
- CEO Back Office Development `workspaces` and `workspace_members`: RLS enabled, FORCE RLS false, policy counts 4 and 2 respectively.
- Marketing OS Development `workspaces` and `workspace_members`: RLS enabled, FORCE RLS false, policy counts 3 and 2 respectively.
- Marketing OS Development: seven tables remain RLS-enabled with zero policies: `marketing_behavior_batches`, `marketing_behavior_config`, `marketing_behavior_limits`, `marketing_business_types`, `marketing_segment_business_types`, `youtube_projects`, `youtube_quota`. Catalog SELECT privilege checks returned anon/authenticated SELECT=false for the listed tables in this query; advisor findings still require grant/path review.
- `marketing_security.workspace_mapping_attestations` is absent in Marketing OS Development (catalog query count=0). No owner evidence, registry, expiry, revocation or replay controls were runtime-verified.
- SQL reads in this refresh were limited to catalogs, function definitions, grants, policies, migration ledger, and Cron job metadata. No application rows were read, no RPC invoked, and no SQL/DDL/DML applied.

## Supabase Security Advisor (fresh)
- Marketing OS Development: 7 RLS/no-policy findings and 26 authenticated SECURITY DEFINER findings.
- CEO Back Office Development: 2 policy/RLS-disabled findings, 8 RLS/no-policy findings, 5 mutable search_path findings, 17 anon SECURITY DEFINER findings, 34 authenticated SECURITY DEFINER findings, and leaked-password protection disabled advisory.
- Advisor findings are not proof of exploitation. Function-by-function authorization, grants, dependency and RLS policy review remains required.
- Cron metadata query returned active jobs `billing-cron-daily` (schedule `0 2 * * *`) and `weekly-report-friday` (schedule `0 2 * * 5`). This refresh did not inspect command strings, invoke jobs or verify endpoint URL/secret configuration.

## Vercel
- Authoritative project: `ceo-ai-marketing-os`; ID `prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`; team `team_oryw9VGF4TLakA4qBU6pGx43`; SSO protection enabled.
- Exact-SHA deployment lookup for PR #24 head `58c159d9...` returned zero deployments. Lookup for PR #23 head `52c067432...` also returned zero deployments.
- Latest visible authoritative deployment is READY on old SHA `f7263085138c58cdda7f3ebe2f63f023b200d277`, target null. It is not a PR #24/#23 authenticated preview.
- No deployment was created, no environment variables or secrets were read/changed, and no Production mutation was performed.

## Acceptance gates
- Source/static/offline/typecheck/build gates on PR #24 exact head: PASS (3 workflows).
- Owner attestation, Trusted Owner Verification, dual-owner consent, registry runtime, expiry/revocation/replay prevention: UNVERIFIED.
- Dedicated non-BYPASSRLS audit identity and Tenant A/B tests: NOT READY / UNVERIFIED.
- Read-only Adapter live E2E and cross-project application data read: NOT RUN / OFF.
- Authenticated exact-SHA Vercel Preview and desktop/mobile Approved UX/UI V4 visual acceptance: BLOCKED / UNVERIFIED.
- Production: LOCKED. Keep PRs draft and unmerged.
