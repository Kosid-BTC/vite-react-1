# CEO AI Thailand → Marketing OS: Back Office-only Integration Boundary

Status: DEVELOPMENT DESIGN / NOT CONNECTED

## 1. Approved scope

Connect only the CEO AI Thailand marketing back-office functions to Marketing OS. The integration is for marketing operations and business-performance signals, not website account management.

Permitted data classes (allowlist; only fields confirmed to exist in the source system may be enabled):
- Business brief and business type
- Product/service catalogue fields intended for marketing
- Audience segment definitions and non-identifying hypotheses
- Content items, editorial status, publication schedule, channel and campaign metadata
- Campaign objectives, budgets, aggregate delivery metrics and aggregate conversion metrics
- Marketing experiment definitions and aggregate outcomes
- Attribution and KPI aggregates that cannot identify a person

Every field must have a documented purpose, owner, source, retention period and sensitivity classification before it is enabled.

## 2. Explicit exclusions — do not connect

- Website User/Auth databases, auth identities, password hashes, sessions, refresh/access tokens or MFA factors
- User profiles, names, email addresses, phone numbers, postal addresses or government identifiers
- Individual customer/lead/contact records, CRM contact details, user-level event streams or behavioral histories
- User IDs, auth UUIDs, email matching, identity resolution, audience exports or user-level lookalike seed files
- Any cross-system user table, foreign key, identity mapping, or user synchronization
- Any write-back into website user/account systems

No user database credentials, service-role keys, JWTs or database connection strings may be supplied to Marketing OS.

## 3. Recommended integration pattern

Use a server-to-server Marketing Back Office API contract, not direct database federation:
1. The website back office exposes a narrowly scoped endpoint or signed outbound event for approved marketing objects only.
2. Marketing OS consumes the endpoint from a server-side route/worker using a dedicated machine credential held only in Development secrets.
3. The API accepts a versioned schema, strict field allowlist, bounded payload size, timestamp, idempotency key and request signature or OAuth client credentials.
4. Marketing OS validates the payload, records source/version/freshness metadata, and stores only approved marketing-operational data in its own Development data store.
5. Default direction is source → Marketing OS. Any write-back or execution command must be a separately reviewed contract with explicit approval and audit trail.

Do not give Marketing OS direct access to the website database. Do not use a website user's session or JWT as an integration credential.

## 4. Initial payload contract (illustrative; not a claim that source fields/endpoints exist)

~~~json
{
  "schema_version": "1.0",
  "source_system": "ceoaithailand-backoffice",
  "object_type": "campaign",
  "object_id": "non-personal-campaign-id",
  "updated_at": "2026-11-27T00:00:00Z",
  "data": {
    "campaign_name": "example",
    "business_type": "example",
    "audience_segment_code": "example",
    "channel": "example",
    "status": "draft",
    "budget": 0,
    "aggregate_metrics": {
      "impressions": 0,
      "clicks": 0,
      "conversions": 0
    }
  }
}
~~~

The example is a schema illustration only. Do not deploy it until actual source objects, definitions, consent/legal basis where applicable, and endpoint behavior are verified. Reject payloads containing person-level or user-identifying fields, including unknown fields by default.

## 5. Security and privacy acceptance gates

- Separate Development credentials; least privilege; rotation and revocation tested.
- No access path from the integration principal to website User/Auth tables or personal-data endpoints.
- Server-side secret handling only; never expose credentials to browser bundles or client storage.
- Strict schema validation and reject-by-default field allowlist.
- Aggregate metrics only; enforce minimum aggregation thresholds where small cohorts could reveal individuals.
- Tenant/workspace scope must be explicit and verified for marketing objects; never choose the first/default workspace.
- Audit every request, source, schema version, actor/service identity, scope, result and timestamp without logging secrets or personal data.
- Negative tests: user/auth endpoints denied; PII fields rejected; unknown fields rejected; wrong tenant rejected; expired/revoked credential denied; replay rejected.
- No production credential, production database read, production write, or production deployment during Development work.

## 6. Current verified state and blockers

- The repository Kosid-BTC/CEOAITHAILAND was inspected on main; its src/App.tsx and index.html are Vite starter-template files. It is not currently verified as the live website's actual application source or as the back-office API implementation.
- No source API endpoint, data dictionary, server-side auth mechanism, or Development credential has been verified.
- Marketing OS's supplementary adapter currently fails closed with WORKSPACE_MAPPING_UNVERIFIED and performs no cross-project request. Keep it disabled until the new API contract is implemented and independently tested.
- This document does not enable any integration, read any application data, alter any database, or change any deployment.

## 7. Release decision

Development-only design and implementation are allowed. Keep live data exchange disabled until the actual back-office source, approved non-user field inventory, API endpoint, machine identity and negative security tests are verified.

Production remains locked. Status: NOT CONNECTED / NOT PRODUCTION COMPLETE.
