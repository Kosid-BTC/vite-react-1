# P1.0.1 — Pricing Reconciliation Gate

Status: REQUIRED BEFORE GROWTH CORE INTEGRATION

## Current approved package source

Package pricing follows the latest approved Landing Page contract in `src/pages/LandingPage.tsx`.

Current package set:

- Free Trial — ฿0 / 15 days
- Growth — ฿1,490 / month
- Scale — ฿5,900 / month

The prior instruction to normalize a Starter plan to ฿790/month is superseded and must not be treated as current package truth.

## Required correction

The local P1.0 result reported Starter ฿790/month as canonical/runtime pricing. Before advancing to Growth Core integration, reconcile that drift.

1. Identify every file/contract changed by local commit `0301bac2768ca74b113827ea0391724c397bdc15` that introduced or canonicalized ฿790.
2. Restore package semantics to the approved Landing Page package set above.
3. Prefer one canonical pricing contract and derive all public/runtime consumers from it.
4. Reconcile marketing, analytics, SEO/schema, llms, billing-facing copy, tests, fixtures and control-center offer display.
5. Preserve the completed MetricMaturity, measurement-health gate and campaign/landing lineage work.
6. Do not weaken Human Decision, Growth Core, RLS or security contracts.
7. Do not deploy, mutate production, or merge to main.

## Validation

- pricing contract tests
- no active runtime/public consumer contains Starter ฿790 as current pricing
- focused P1.0 regression tests remain passing
- scoped source lint
- full test run
- build/typecheck
- `git diff --check`

## Exit criteria

Return `P1_0_1_PRICING_RECONCILIATION: PASS` only when the current package set is exactly:

- ฿0 / 15-day trial
- Growth ฿1,490/month
- Scale ฿5,900/month

Then proceed to P1.1: Trusted Marketing Outcome Evidence → Growth Core bridge.
