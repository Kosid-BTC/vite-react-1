# CEO / Marketing — verified field mapping decisions (2026-11-22)

**Status: DEVELOPMENT-ONLY DESIGN, NO-GO.** Source inspection performed with read-only catalog queries. No database changes authorized or performed.

## Identity and workspace columns
Both public.workspaces have id uuid, name text, owner_id uuid, created_at timestamptz. Marketing additionally has slug text. Both public.workspace_members have workspace_id uuid, user_id uuid, role text, created_at timestamptz.

Decision: CEO workspace IDs are *candidate* canonical IDs, NOT approved mappings. Marketing slug is not evidence of common ownership. No matching by name, slug, row position, or first workspace. A verified owner attestation plus explicit source ID -> target ID and reviewed identity mapping is mandatory. Reject missing, duplicate or revoked mappings.

## Audience segments: do not silently lose semantic data
Common columns: id, workspace_id, brand_id, code, name, description, buying_triggers, active, created_at, updated_at.
CEO-only: pain_points jsonb, goals jsonb.
Marketing-only: jobs_to_be_done jsonb, pains jsonb, anxieties jsonb, desired_outcomes jsonb, objections jsonb, search_intents jsonb, evidence_status text, evidence jsonb.
Decision: stage source payload in a private development-only staging schema; preserve source provenance, JSON structure, code and evidence_status. Do not equate pains with pain_points or desired_outcomes with goals without documented semantic review. Preserve hypothesis status. Never overwrite CEO's audience registry with Marketing values.

## Security and application gate
Function collisions (create_workspace, ensure_default_workspace, is_member, invite_member, list_members, remove_member, set_member_role) have different bodies; some Marketing functions are SECURITY DEFINER while CEO counterparts are SECURITY INVOKER. No replacement without body/owner/grant/search_path analysis. Prevent first-workspace selection; deny if verified mapping absent or ambiguous.

## Required next evidence
- Per-table column type/null/default/check/FK/index semantic diff; exact RLS policy expressions and grant inventory
- Auth identity lineage and owner-signed attestation without exposing PII in Git
- Backup hash, actual isolated PG17 restore and rollback drill
- Non-BYPASSRLS tenant A/B, adapter, authenticated UX/UI acceptance
- Separate production cutover authorization
