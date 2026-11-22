# CEO + Marketing collision resolution and cutover runbook — 2026-11-22
Status: NO-GO. Development-only design; no migration executed.

## Verified catalog comparison
| Table | CEO columns | Marketing columns | CEO outgoing FKs | Marketing outgoing FKs | CEO policies | Marketing policies | Decision |
|---|---:|---:|---:|---:|---:|---:|---|
| marketing_audience_segments |12|18|2|2|4|4|Transform / semantic policy review|
| marketing_brand_rules |9|9|2|2|4|4|Transform (column definitions differ)|
| marketing_brands |12|9|2|1|4|4|Transform / FK mapping|
| marketing_campaigns |17|15|6|7|4|4|Transform / FK mapping|
| marketing_content_items |17|16|6|8|4|4|Transform / FK mapping|
| marketing_content_versions |15|14|3|3|4|4|Transform|
| marketing_message_pillars |11|11|2|2|4|4|Transform|
| marketing_offers |12|10|2|2|4|4|Transform|
| workspace_members |4|4|2|2|4|2|Owner-attested identity remap|
| workspace_state |3|3|1|1|1|1|Column definition matches; trigger differs|
| workspaces |4|5|1|1|4|3|Canonical CEO workspace + attested map|

All 11 have RLS enabled. Column definitions differ for 10/11 (hash of ordered name/type/nullability/default). Trigger count: CEO has 1 each on eight marketing tables and workspace_state; Marketing has 0 for all 11. These counts are metadata only, not behavioral parity.

## Function collision evidence
Public function bodies differ for shared signatures: create_workspace(p_name text), ensure_default_workspace(), invite_member(p_workspace uuid,p_email text), is_member(ws uuid), list_members(p_workspace uuid), remove_member(p_workspace uuid,p_user uuid), set_member_role(p_workspace uuid,p_user uuid,p_role text). On CEO create_workspace/ensure_default_workspace/invite_member/list_members/remove_member/set_member_role are SECURITY INVOKER, while Marketing versions are SECURITY DEFINER. Never replace CEO functions with Marketing definitions. Inspect bodies, owners, grants and search_path before any decision. Explicitly remove first-workspace fallback in a separately reviewed development patch; do not mutate production.

## Mapping registry (proposed, NOT deployed)
See DEV_IDENTITY_WORKSPACE_MAPPING_REGISTRY_PROPOSED.sql. Only explicit source ID -> target ID mapping; reviewed owner evidence reference and SHA256 required to mark verified. Pending/rejected/revoked deny. Unique verified targets; no first-workspace fallback. Schema unexposed, no policies for anon/authenticated; privileged audit access to be separately attested. Registry DDL has not been run.

## Backup and isolated restore gate
1. Attest exact source project, UTC timestamp, PG major version, immutable commit SHA, read-only session principal and effective privileges. Audit credential must have no superuser/CREATEDB/CREATEROLE/BYPASSRLS/write/CREATE grants directly or via membership.
2. Acquire authorized actual backups using approved backup/export mechanism; include schema, data, roles/ownership/grants, RLS, functions, triggers, extensions, storage inventory, Auth and Edge Function dependencies; separately secure credentials and secrets. Compute SHA256 and store in restricted evidence registry. Never store dumps or user data in Git.
3. Restore in isolated PostgreSQL 17 with no production network credentials. Verify checksum, object counts, owners/grants, FK integrity, policy/function semantic parity and row counts by tenant. Synthetic restore cannot substitute for actual backup.
4. Generate non-sensitive transformation and collision decisions; use masked fixtures for test runs, never duplicate active sessions/passwords. Auth migration requires dedicated design and owner confirmation.
5. Execute tenant A/B authenticated non-BYPASSRLS tests and verify denial of unmapped workspace and cross-tenant access. Run adapter and E2E tests only after gates pass.
6. Cutover requires separate explicit owner approval, matching exact SHA across CI and Vercel authenticated preview, UX/UI V4 Desktop 1536x1024 and Mobile 390x844 acceptance, rollback drill and restore time evidence.
7. On any failed gate stop and keep both production projects unchanged; retain original Marketing project until independently approved decommissioning.

## Current verdict
Backup attestation: UNVERIFIED; actual isolated restore: UNVERIFIED; owner evidence: UNVERIFIED; RLS/RPC integration: UNVERIFIED; authenticated UX/UI: UNVERIFIED. Marketing development branch MIGRATIONS_FAILED (last observed). NO-GO / NOT PRODUCTION COMPLETE.
