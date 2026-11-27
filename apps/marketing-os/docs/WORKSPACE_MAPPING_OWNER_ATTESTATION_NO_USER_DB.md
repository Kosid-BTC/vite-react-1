# Workspace Mapping Owner Attestation — No User DB / No Identity Mapping

**Status: DESIGN ONLY / DEVELOPMENT ONLY / NOT IMPLEMENTED.** This document does not authorize a database migration, API connection, credential creation, cross-project database read, or Production change.

## 1. Binding decisions

1. CEO AI Thailand Back Office → Marketing Intelligence → Marketing Execution is a tenant-scoped marketing integration, not a user-account integration.
2. Do not connect to, query, replicate, or synchronize the website User/Auth database.
3. Do not transfer or persist user IDs, Auth UUIDs, email addresses, phone numbers, profiles, sessions, JWTs, refresh tokens, customer/lead/contact records, or user-level event histories.
4. Workspace Mapping maps **one explicitly selected Marketing OS workspace to one explicitly selected Back Office workspace**. It does not map people or infer that the two workspaces have the same owner identity.
5. Each system must verify its own workspace owner and membership inside its own security boundary. The other system receives only a signed, scoped owner-consent receipt containing no owner subject identifier.
6. Missing, ambiguous, expired, revoked, replayed, mismatched, or unverifiable mapping must fail closed. Never choose the first, oldest, default, or only workspace implicitly.

## 2. Owner evidence without identity federation

The owner proves control only inside the system that owns the workspace:

- Marketing OS verifies the owner in Marketing OS's own Auth context and issues a signed consent receipt for the exact Marketing OS workspace.
- CEO Back Office verifies the owner in Back Office's own Auth context and issues a separate signed consent receipt for the exact Back Office workspace.
- The two receipts are bound to the same one-time challenge, explicit workspace pair, audience, scope, and expiry.
- The receiving service validates the issuer signature and receipt status. No Auth database, user table, user ID, email, or user session is queried or copied across projects.
- The two owner identities are not compared, joined, hashed, or stored as a cross-system identity mapping.

### Illustrative signed receipt payload

This is a protocol example only. It is not an existing endpoint, deployed key, or verified source contract.

```json
{
  "schema_version": "1.0",
  "issuer": "ceo-backoffice-development",
  "audience": "marketing-os-workspace-mapping",
  "workspace_ref": "opaque-workspace-reference",
  "consent_event_id": "random-opaque-event-id",
  "scope": ["marketing.backoffice.export"],
  "challenge_nonce": "single-use-random-nonce",
  "issued_at": "2026-11-27T00:00:00Z",
  "expires_at": "2026-11-27T00:15:00Z",
  "revocation_handle": "opaque-random-revocation-handle",
  "kid": "approved-issuer-key-id"
}
```

The signed payload must not contain `sub`, owner IDs, Auth UUIDs, email, phone, profile attributes, session tokens, or customer information. The signature algorithm must be explicitly allowlisted; reject `none`, unknown algorithms, untrusted issuers, wrong audiences, stale timestamps, reused nonces, and unknown key IDs. Public verification keys must be pinned or obtained from a separately approved issuer-key endpoint with controlled rotation.

## 3. Minimal mapping registry shape

If and only if the Development recovery and security gates pass, a future private registry may store:

- `mapping_id`
- `marketing_workspace_id` — local Marketing OS tenant reference
- `backoffice_workspace_ref` — opaque Back Office tenant reference
- `marketing_consent_event_id` and `backoffice_consent_event_id`
- SHA-256 digests of the two signed receipts
- issuer key IDs, approved scope, schema version, and challenge identifier
- independently verified timestamps, expiry, revocation timestamp/reason, and service audit timestamps

It must **not** store `primary_owner_user_id`, `supplementary_owner_user_id`, `reviewed_by_user_id`, Auth-user foreign keys, email, phone, JWTs, API secrets, or personal records. The current PR #24 comment-only SQL proposal contains owner-user-ID fields and `auth.users` foreign keys; under this revised no-identity boundary, that proposal is **NOT APPROVED FOR EXECUTION** and must be redesigned before any executable migration is considered.

The registry must be in a non-exposed schema, with RLS enabled and forced, no direct grants to `anon` or `authenticated`, and no broad service-role read path. Any future server-side verifier/RPC requires a separate least-privilege review, pinned `search_path`, explicit tenant scope, expiry/revocation enforcement, and negative tests.

## 4. Data-plane contract: marketing objects only

After the source Back Office API and Development machine identity are independently verified, the only eligible data classes are:

- business briefs, business types, and product/service catalogue metadata
- non-identifying audience-segment definitions and hypotheses
- content/editorial metadata and calendar status
- campaign metadata, objectives, channel, and budget
- aggregate campaign delivery, conversion, attribution, and experiment outcomes

Use a server-to-server API, strict versioned field allowlist, request signing or OAuth client credentials, idempotency key, timestamp/nonce replay protection, bounded payload size, audit logging, and explicit workspace scope. Aggregate metrics must not expose small cohorts or enable reconstruction of individuals. Unknown fields are rejected by default.

The following are always excluded: website User/Auth tables, user profiles, PII, individual leads/customers/contacts, user-level events, identity resolution, audience exports, user IDs, and account-system write-back. Do not use a browser session or website user JWT as a machine credential.

## 5. Workspace selection, RLS, and RPC requirements

- Every operation receives an explicit workspace identifier and verifies membership/role for that exact workspace.
- No automatic first-workspace, oldest-membership, fallback, or silent workspace creation is permitted.
- Tenant-owned tables require workspace-scoped RLS policies for SELECT/INSERT/UPDATE/DELETE as applicable, with both `USING` and `WITH CHECK` predicates.
- Require `FORCE ROW LEVEL SECURITY` where the threat model requires it; prove that the runtime and audit principals do not bypass RLS.
- RPCs must validate caller identity, role, and explicit workspace scope. SECURITY DEFINER functions require a documented owner, fixed safe search path, minimal grants, and negative authorization tests.
- The legacy `ensure_default_workspace()` function must not be invoked. Its existence/grants are a database gate, not something a source-code callsite guard can fix.

## 6. Required tests before enabling any read path

1. Tenant A can access only Tenant A's synthetic records; Tenant B can access only Tenant B's synthetic records.
2. Cross-tenant SELECT, INSERT, UPDATE, DELETE, and RPC attempts are denied.
3. Missing, malformed, ambiguous, or unowned workspace references fail closed.
4. Both signed owner receipts are required; wrong issuer/audience/scope/workspace/challenge, invalid signature, unknown key, expired receipt, revoked receipt, replayed nonce, and key-rotation edge cases are denied.
5. No owner/user identifiers or PII are present in stored mapping rows, API payloads, logs, traces, or screenshots.
6. Unknown and forbidden payload fields, individual leads, user-level events, and user identifiers are rejected.
7. The disabled adapter makes zero network calls. The enabled server-to-server adapter uses only its Development machine identity and approved marketing API routes; it never creates a Supabase client for the other project.
8. Idempotency, rate limits, audit provenance, expiry, revocation propagation, and failure/retry behavior are tested.
9. Tests run with dedicated non-BYPASSRLS Development identities, not a postgres, service-role, or read-only bypass principal.

## 7. Current evidence and blockers — 2026-11-27

- Marketing OS Development branch: `roprejhnhoaqlctltwfs`, branch ID `e2139d78-2675-4863-ac64-a5fad7c8f826`, `with_data=false`, branch status `MIGRATIONS_FAILED`. Its preview project status is `ACTIVE_HEALTHY`; that does not mean migration recovery passed.
- CEO Back Office Development branch metadata: `tdeuyycqbbktacmxgktn`, branch ID `2172c0d4-e534-4fe8-918e-5c99ad35ae45`, `with_data=false`, status `FUNCTIONS_DEPLOYED`. No cross-project application data was read for this refresh.
- Marketing Development catalog-only inspection confirms `marketing_security.workspace_mapping_attestations` does not exist. No migration was applied.
- Marketing Development security advisors currently report 7 RLS-enabled tables without policies and 26 SECURITY DEFINER functions executable by `authenticated`.
- Catalog-only inspection confirms `marketing_business_types` and `marketing_segment_business_types` have RLS enabled but zero policies; the inspected workspace/content/brand/campaign/evidence tables have RLS enabled but `FORCE RLS=false`.
- `ensure_default_workspace()` remains SECURITY DEFINER, uses `search_path=public`, is executable by `authenticated`, and selects the earliest workspace membership before creating a personal workspace if none exists. Do not invoke it.
- The SQL connector session is `postgres` with `BYPASSRLS=true`; `service_role` and `supabase_read_only_user` also have `BYPASSRLS=true`. No dedicated non-BYPASSRLS Tenant A/B audit identity is evidenced.
- PR #24 static/offline CI passes on its exact head, but these checks do not establish live RLS, owner receipts, Tenant A/B isolation, or a working API integration.
- PR #37 is documentation-only. The legacy Vercel GitHub status is not authoritative Preview evidence. The authoritative Vercel project has no deployment records for the inspected PR #23, #24, or #37 exact SHAs; its latest deployment is on a different SHA with `target=null`.
- The PR #24 pure TypeScript offline attestation model and its test fixtures still contain `ownerUserId` and `reviewedByUserId`. They perform no network/database access, but this shape is incompatible with the no-identity contract and must be refactored before any mapping acceptance; existing offline PASS does not certify the no-identity boundary.
- The live CEO AI Thailand website Back Office source/API, field dictionary, approved Development API endpoint, issuer keys, and dedicated Development machine credential remain unverified.

## 8. Release disposition

Keep the current supplementary Supabase adapter disabled and fail-closed. Do not apply the PR #24 comment-only SQL proposals, repair migrations, create roles, grant RPC execution, enable any cross-project database read, configure Production secrets, or deploy to Production.

The next safe implementation sequence is: (1) identify and verify the actual Back Office source/API and marketing-only field dictionary; (2) complete Marketing Development backup attestation, PostgreSQL 17 isolated restore, migration recovery, and least-privilege audit identity; (3) revise the mapping/RPC design to this no-identity contract, then run synthetic Tenant A/B and negative tests before an exact-SHA authenticated Preview and UX/UI V4 acceptance.

**Current status: DESIGN ONLY / NOT CONNECTED / NOT PRODUCTION COMPLETE.**
