# P3.0 — Analytics Foundation

Status: **AUTHORIZED / NON-PRODUCTION ONLY**

## Objective
Establish the first Phase 3 Growth Intelligence boundary: trusted first-party funnel evidence must be evaluated for measurement health before rates, economic conclusions, experiments, attribution, lead scoring, or Next Best Action can consume it.

Canonical boundary:

`Trusted Evidence -> Funnel Counts -> Measurement Health -> Eligible Metrics -> Human-readable Analytics Summary`

## Scope
- Tenant-scoped analytics inputs must preserve `workspaceId` and optional campaign/content lineage.
- Canonical funnel stages: Exposure, Attention, Intent, Activation, Revenue, Retention.
- Every optimized funnel stage requires a defined event/KPI identifier.
- Inputs are explicit observed counts only; this slice must not infer or fabricate missing observations.
- Measurement health evaluates event-definition coverage and data maturity before rate conclusions.
- Below the configured maturity threshold, output counts only and mark rate/economic conclusions ineligible.
- Missing event definitions make measurement health unhealthy and require evidence collection/configuration before optimization.
- Deterministic evaluation: identical inputs and threshold must return identical outputs.

## Explicit non-goals
- No predictive scoring.
- No automatic experiment creation or winner declaration.
- No attribution model.
- No LTV/CAC/ROAS claims.
- No lead scoring or Next Best Action.
- No autonomous mutation, publishing, budget action, production provider call, production deployment, remote production Supabase mutation, remote SQL/migration/db push, or merge to `main`.

## PASS evidence
P3.0 is PASS only when executable evidence proves:
1. lineage is preserved;
2. observed counts are never fabricated;
3. missing stage event definitions produce unhealthy measurement status;
4. low maturity produces counts-only eligibility;
5. adequate maturity permits rate eligibility without calculating unsupported economic metrics;
6. deterministic evaluation is stable;
7. P1/P2 regression gates, typecheck, build, lint/diff, and disposable-local-Supabase RLS gates remain green.
