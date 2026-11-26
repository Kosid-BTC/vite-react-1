# CEO AI Thailand — Controlled Production Policy

Status: APPROVED FOR IMPLEMENTATION
Owner decision date: 2026-08-30

## Release Strategy

CEO AI Thailand will launch in **Controlled Production** first for the current internal/single-user operating model. It will **not** be sold as a Public SaaS yet.

Public SaaS is allowed only after both gates are satisfied:

1. **Revenue Validation Gate** — CEO AI Thailand reaches the owner-approved revenue target using the controlled-production system.
2. **Multi-tenant Security Gate** — RLS and tenant-isolation verification passes using separate test users/workspaces, including cross-workspace denial for SELECT, INSERT, UPDATE, and DELETE.

## Controlled Production Gate

Controlled Production may proceed for the current internal/single-user operation only after the minimum production safety checks pass:

- authenticated access works as intended;
- workspace ownership/authorization boundaries are enforced for the active account;
- no unintended anonymous or public write paths exist;
- service-role/server-only credentials are not exposed to the client;
- migration/recovery path is documented and verified sufficiently for controlled production;
- critical smoke tests pass for the deployed application and data path;
- public self-registration/invite flow remains disabled or otherwise blocked until the Public SaaS gate is approved.

## Public SaaS Gate

Before opening registration, invitations, or sales to multiple external tenants, all of the following must be verified with evidence:

- separate test users and workspaces;
- authenticated JWT/RLS CRUD tests;
- cross-workspace SELECT denial;
- cross-workspace INSERT denial;
- cross-workspace UPDATE denial;
- cross-workspace DELETE denial;
- tenant isolation across relevant Marketing OS / Growth Core tables;
- rollback and migration reset/reapply verification;
- concurrency/idempotency checks for material workflows;
- regression, lint, typecheck, test, and build PASS for the release candidate.

## Business Rule

The system should first prove that it can generate measurable business value for CEO AI Thailand. Only after the revenue target is reached and the multi-tenant security gate is PASS should the product move to Public SaaS commercialization.

## Human Approval Boundary

AI may recommend diagnoses, next-best-actions, experiments, and content/actions. Material business actions, production mutations, billing/spend changes, and Public SaaS release require human approval.

## Release States

- `CONTROLLED_PRODUCTION_CANDIDATE`
- `CONTROLLED_PRODUCTION_ACTIVE`
- `REVENUE_VALIDATION_IN_PROGRESS`
- `PUBLIC_SAAS_BLOCKED`
- `PUBLIC_SAAS_READY`

Default state after this decision: `PUBLIC_SAAS_BLOCKED` until both required gates pass.
