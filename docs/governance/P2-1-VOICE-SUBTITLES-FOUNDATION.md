# P2.1 Voice / Subtitles Foundation

Status: AUTHORIZED / NON-PRODUCTION ONLY

## Objective
Establish a provider-neutral, deterministic voice/subtitle boundary that consumes an approved generated media asset and produces reviewable draft narration/subtitle metadata without calling a real provider.

Canonical flow:

`Generated Draft Asset -> Voice/Subtitle Request -> Provider-neutral Draft -> Deterministic Subtitle Cues -> Human Review -> Approved for Scheduling`

## Invariants
- Input must preserve `workspaceId`, `campaignId`, `contentItemId`, and source `assetId` lineage.
- Voice and subtitle provider contracts are abstractions only; no provider SDK/API call or provider secret is allowed in P2.1.
- Subtitle cues must be deterministic, ordered, non-overlapping, and have non-negative integer millisecond timestamps.
- Empty subtitle text and invalid timing are rejected.
- Draft outputs remain `publishable: false` and `approvalRequired: true`.
- P2.1 must not implement scheduling, publishing, production callbacks, or autonomous actions.
- No remote production Supabase mutation, remote SQL/migration/db push, production deploy, or `main` merge.

## PASS evidence
- focused executable test for lineage preservation
- deterministic cue generation
- invalid/overlapping timing rejected
- no client-secret surface
- human approval remains mandatory
- existing P1.3/P1.4/P2.0 and Phase 1 regressions remain green
- typecheck/build/lint/diff remain green
