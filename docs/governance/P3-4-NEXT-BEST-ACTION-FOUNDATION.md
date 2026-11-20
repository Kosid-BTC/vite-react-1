# P3.4 Next Best Action Foundation

## Purpose

P3.4 turns verified Lead/Sales Intelligence evidence into a bounded, review-only recommendation for the next human action. It does not execute outreach, publish content, mutate budgets, change CRM state, or claim causal impact.

## Evidence boundary

Recommendations may use only a workspace-scoped `LeadSalesAssessment` produced from first-party observed evidence. The assessment must preserve evidence references, evidence maturity, stage, `score: null`, `causalClaim: false`, `humanReviewRequired: true`, and `executable: false`.

If evidence maturity is `INSUFFICIENT`, the only permitted recommendation is `COLLECT_EVIDENCE`. No sales or marketing action may be inferred from missing evidence.

## Deterministic recommendation policy

- `UNKNOWN` -> `COLLECT_EVIDENCE`
- `LEAD` -> `REVIEW_LEAD_CONTEXT`
- `ENGAGED` -> `PREPARE_HUMAN_FOLLOW_UP`
- `QUALIFIED` -> `PREPARE_DISCOVERY`
- `OPPORTUNITY` -> `PREPARE_PROPOSAL_REVIEW`
- `CUSTOMER` -> `REVIEW_CUSTOMER_OUTCOME`
- `LOST` -> `REVIEW_LOSS_EVIDENCE`

The recommendation is a deterministic policy output, not a score, probability, causal claim, or prediction.

## Governance guards

Every recommendation must:

1. Match the same workspace and lead scope as its input assessment.
2. Carry forward only observed evidence references; no fabricated evidence.
3. Set `score` to `null` and `scoreReason` to `SCORING_NOT_AUTHORIZED`.
4. Set `causalClaim` to `false`.
5. Set `humanApprovalRequired` and `humanReviewRequired` to `true`.
6. Set `executable` to `false`.
7. Never call external channels, mutate a CRM, publish content, change spend, or authorize production actions.
8. Treat `INSUFFICIENT` evidence as a hard maturity gate.

## Acceptance evidence

P3.4 is complete only when the domain implementation, focused executable verifier, package test script, PR3 Gate CI step, exact-head CI success, PR3 Gate success, Marketing OS typecheck/build, and root regression/build/lint are all verified on the same PR #3 head.

Production deployment, remote Supabase mutation, merge to `main`, autonomous publishing, and autonomous budget mutation remain outside this slice and are prohibited.