# CEO AI Thailand + Marketing OS — Development-only consolidation assessment (2026-11-22)

Status: **ASSESSMENT ONLY / NO-GO**. Owner authorized assessment and preparation in Development only. No production mutations, cross-project reads, merges, or cutover.

## Verified read-only inventories
- CEO project: `waigsnxhrlwtiotspaim`, PostgreSQL 17, Singapore; auth users 4; workspaces 3; workspace_members 3; public RLS tables 75; public policies 164.
- Marketing project: `bjozpwdtqbpwcxnqguka`, PostgreSQL 17, Tokyo; auth users 11; workspaces 3; workspace_members 11; public RLS tables 44; public policies 96.
- Confirmed same-name tables in both: `marketing_audience_segments`, `marketing_brand_rules`, `marketing_brands`, `marketing_campaigns`, `marketing_content_items`, `marketing_content_versions`, `marketing_message_pillars`, `marketing_offers`, `workspace_members`, `workspace_state`, `workspaces`.
- Counts are independent per project; never infer user identity overlap, matching workspace owners, row-level equality, policy equivalence, or schema compatibility from counts alone.

## Proposed architecture (NOT APPROVED FOR DEPLOYMENT)
CEO project as candidate system of record for identity and workspaces; Marketing as a logical module under its own schema in an isolated Development restore. Reconcile existing CEO marketing tables rather than overwriting. No first-workspace fallback: resolve by explicit, owner-attested workspace mapping; ambiguity or missing mapping must deny access.

## Mandatory gates
1. Capture immutable, attested schema inventories (columns/types/defaults, constraints/FKs/indexes, functions, triggers, views, extensions, grants, policies and owner inventory) for BOTH projects with verified least-privilege audit sessions. Diff collisions semantically.
2. Verify auth identities by safe identifiers under approved access; document user ID mapping, provider/email confirmation and duplicate handling. Never copy passwords, sessions or tokens; avoid merging auth.users directly. Preserve lineage.
3. Inventory workspace ownership and memberships with owner-signed evidence; generate explicit source-to-target mapping and deny unmapped/ambiguous tenants. No `LIMIT 1` workspace fallback.
4. Attest actual backup + checksum + owner/grant inventory; isolated PostgreSQL 17 restore; document rollback and replay plan. Synthetic restore alone is insufficient.
5. Test RLS/RPC as distinct non-BYPASSRLS Tenant A/B sessions, deny cross-tenant read/write, verify SECURITY DEFINER and view invoker semantics; keep adapter disabled until proven.
6. Run integration tests CEO Back Office → Marketing Intelligence → Marketing Execution, authenticated preview and approved UX/UI V4 1536x1024 and 390x844 at one exact SHA.
7. Require new explicit owner approval for any Production change or cutover.

## Cutover decision / rollback
Before cutover: reconciled row counts and checksums by tenant; immutable evidence registry; auth migration plan; release and rollback SHA; verified restoration time; traffic freeze/write-drain strategy; dual-write risks assessed. Go/No-Go signoff from owner after security and runtime acceptance. Retain source project until post-cutover reconciliation and separately approved retirement.

## Current blockers
- Existing Marketing Development branch previously reported MIGRATIONS_FAILED; verify fresh branch state.
- Audit credential previously failed least-privilege; actual protected CI credential must be separately attested.
- No actual isolated restore, owner-attested mapping or authenticated tenant A/B evidence.
- No production mutation authorized.
