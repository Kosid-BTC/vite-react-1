# P1.4 Outcome / Learning Boundary

## Source authority
This gate is the next bounded slice of the already-authorized P1.0 Continuous Marketing Improvement Loop after P1.3 closed the Human Decision boundary:

`Acquisition → Landing Variant → CTA/Activation → Trusted Evidence → Measurement Health → Diagnosis → NBA → Human Decision → Experiment/Action → Outcome → Learning → Next Cycle`

P1.3 covers through Human Decision. P1.4 covers only the remaining non-production domain boundary:

`Approved Human Decision → Manual Experiment Plan → Trusted Outcome Evidence → Learning Record → Next-Cycle Review Proposal`

## Scope
1. Only a Human Decision = APPROVED may produce an experiment plan.
2. Experiment plans are manual-only. The domain layer must never execute providers, publish content, mutate landing pages, or change pricing.
3. Outcome recording must consume canonical Growth Core Evidence and accept only trusted `MEASURED | DERIVED` outcome evidence.
4. Learning records must preserve proposal/action/evidence lineage.
5. Next-cycle output is a review proposal only; it must not autonomously start another experiment.
6. Rejected or pending decisions cannot create plans.
7. Assumed, placeholder, or unavailable outcome evidence cannot create learning.

## Acceptance criteria
- deterministic focused tests cover approved/pending/rejected decision behavior
- manual-only / no autonomous execution is asserted
- trusted outcome evidence produces a learning record with lineage
- untrusted outcome evidence is rejected
- next-cycle result is proposal-only
- P1.3 decision boundary regression remains green
- root regression/build/lint, Marketing OS typecheck/build, and git diff check remain green

## Safety
- no production deploy
- no remote production Supabase mutation
- no production SQL/migration/db push
- no merge to `main`
- no provider integrations
- no auto-publish
- no automatic pricing or landing mutation
- preserve AI proposes → Human decides
