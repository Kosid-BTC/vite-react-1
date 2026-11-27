# CEO Back Office → Marketing OS: production acceptance checklist

## Confirmed inventory (read-only SQL, 2026-11-15)
- Primary project: `bjozpwdtqbpwcxnqguka`, 3 workspaces.
- Supplementary project: `waigsnxhrlwtiotspaim`, 3 workspaces.
- No workspace UUID is shared between these inventories. **Do not infer a mapping from order, name, email, or user UUID.**
- Supplementary RLS SELECT policies on `marketing_daily_campaign_metrics`, `marketing_daily_content_metrics`, `marketing_insights`, `marketing_recommendations` call `mkt_can_read(workspace_id)`.
- `public.mkt_can_read` delegates to `private.mkt_can_read`, a SECURITY DEFINER function checking workspace owner, membership or app admin. Review `is_app_admin()` and RPC EXECUTE grants before acceptance.

## Gate 1 — Mapping evidence
For each pair, obtain independently authenticated owner approval in BOTH projects; capture both workspace UUIDs, each owner's verified user ID, consent event ID/time, reviewer, expiry and revocation. Store attestation in server-controlled registry. Test forged, expired, revoked, and cross-tenant mappings. Never use a matching email as authorization.

## Gate 2 — Security and real-data adapter
Maintain primary Auth/session for Marketing OS and independent supplementary Auth for the source. Do not forward primary JWT as a supplementary JWT. Query only allowlisted fields with workspace predicate, RLS and the supplementary authenticated identity. No service-role bypass, browser-side supplementary secret, or writes to supplementary project. Treat missing source metrics as unavailable. Avoid importing data before both owner attestations and RPC/RLS tests pass.

## Gate 3 — Integration tests
- Owner of both mapped workspaces: permitted read returns only their source workspace rows with evidence and freshness timestamp.
- Primary-only, supplementary-only, no session, wrong workspace, revoked/expired attestation: denied.
- Two simultaneous tenants: no row leakage or cache mixing.
- Missing, stale or malformed metric: no invented KPI.
- Confirm mapping revocation immediately disables reads.

## Gate 4 — CI and authenticated Preview
Record exact commit SHA, typecheck, lint, unit tests, integration tests, Preview deployment ID, authenticated smoke tests and screenshots (1536×1024 desktop, 390×844 mobile) compared to `APPROVED_UI_V4_SOURCE.md`. READY is not a PASS.

## Gate 5 — Production
Only after all prior gates pass: promote the same verified SHA, run authenticated live smoke and tenant isolation checks, capture evidence and rollback plan. Until then: **Cross-project Read OFF; Production unchanged; NOT PRODUCTION COMPLETE.**
