# Business Evolution Intelligence (BEI) — Phase 1

**Status: Draft / Qualification only.** This PR does not deploy, migrate databases, change pricing, or touch Marketing OS Approved V4.

## Delivered
- Thai-language SME discovery questionnaire across six dimensions.
- Deterministic BES diagnostic scoring (version 0.1.0) with weights 15/25/20/20/10/10.
- Evidence Registry TypeScript contract with organization scope, provenance, capture time, consent marker and source quality.
- Tests for missing evidence, cross-organization rejection at scoring boundary, duplicate IDs, liquidity warning and monthly active user math.

## Non-negotiable rules
1. BES is an **uncalibrated diagnostic rubric**, not a scientifically validated survival prediction.
2. Missing evidence means **unknown**: composite score stays null until all six dimensions have evidence. Show coverage separately.
3. AI cannot silently invent financial facts or override deterministic scoring.
4. Critical liquidity risk must remain visible regardless of the composite score.
5. Cross-tenant validation in this module is **not a substitute for database RLS**.
6. Evidence references are internal IDs, not customer PII, public document links, or secrets.
7. A recorded consent field is **not** proof of lawful processing or sufficient authorization.
8. Self-reported inputs must be flagged. Next phase should add per-dimension freshness and source quality rules.
9. Respect repository AGENTS.md: Problem First -> AI Second, existing-business growth as secondary audience, preserve beginner onboarding.

## Gates before any production promotion
- Approve dimension rubric and test against SME pilot outcomes.
- Implement authenticated organization-scoped persistence with append-only audit history.
- Generate and review a Supabase migration through the approved CLI workflow, with explicit RLS tests for SELECT/INSERT/UPDATE/DELETE and roles.
- Add accessible Thai onboarding, consent and assessment UX.
- Run Vitest, TypeScript build, CI, security checks, and UX verification.
- Obtain explicit production release approval. No direct production changes in this phase.
