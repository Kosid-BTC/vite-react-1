# P2.0 Creative Automation Foundation

Status: AUTHORIZED / NON-PRODUCTION ONLY

## Objective
Establish a provider-neutral, resumable media-generation boundary for Phase 2 before any real provider integration.

Canonical flow:

`Approved Content -> Media Job -> Provider Request -> Progress/Resume -> Generated Asset -> Human Review -> Approved for Scheduling`

## Invariants
- Generation supports `TEXT_TO_VIDEO` and `IMAGE_TO_VIDEO` only at this gate.
- Provider abstraction is mandatory; no provider SDK/API call is allowed in P2.0.
- Every job preserves `workspaceId`, `campaignId`, and `contentItemId` lineage.
- Long-running jobs expose explicit lifecycle state, progress `0..100`, provider job reference, retry count, and deterministic resume metadata.
- Generated assets remain `publishable: false` until a later human-controlled scheduling boundary.
- Human approval remains mandatory before scheduling or publishing in Phases 1-3.
- No provider secret may be exposed to browser-facing contracts.
- No remote production Supabase mutation, remote SQL/migration/db push, production deploy, or `main` merge.

## PASS evidence
- focused executable test for provider interchangeability
- invalid progress rejected
- lineage preserved
- deterministic resume metadata
- no client-secret surface
- no autonomous publish path
- existing P1.3/P1.4 and Phase 1 regressions remain green
- typecheck/build/lint/diff remain green
