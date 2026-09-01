# P3.1 Experiment Engine Foundation

Status: AUTHORIZED / NON-PRODUCTION ONLY

## Objective
Establish a deterministic, tenant-scoped experiment evaluation boundary using observed evidence only. AI/system may propose a winner for human review; it may not auto-apply, publish, mutate budgets, or trigger autonomous actions.

## Canonical flow
Experiment Definition -> Observed Variant Evidence -> Evidence Sufficiency -> Deterministic Evaluation -> Human Review Proposal

## Required invariants
- Preserve `workspaceId`, `campaignId`, `experimentId` lineage.
- Require one primary metric and at least two uniquely identified variants.
- Accept only finite, non-negative observed counts for exposures and outcomes.
- Reject outcomes greater than exposures.
- If evidence is below the configured minimum per variant, return `COLLECT_MORE_EVIDENCE` and no winner.
- If top variants tie on the primary observed rate, return `NO_WINNER`.
- Otherwise return `PROPOSE_WINNER` with `humanReviewRequired: true` and `autoApply: false`.
- Never fabricate evidence, confidence, statistical significance, lift, revenue, CAC, LTV, ROAS, or attribution.
- No production Supabase mutation, remote migration/SQL/db push, production deploy, provider action, budget mutation, publishing, or merge to main.

## PASS evidence
- Focused executable verifier proves deterministic evaluation.
- Insufficient evidence returns `COLLECT_MORE_EVIDENCE`.
- Tie returns `NO_WINNER`.
- Valid observed evidence can only produce a human-review proposal.
- Invalid counts and duplicate variants are rejected.
- Existing P1/P2/P3.0 regressions, typecheck, build, lint, diff checks and disposable-local-Supabase RLS gates remain green.
