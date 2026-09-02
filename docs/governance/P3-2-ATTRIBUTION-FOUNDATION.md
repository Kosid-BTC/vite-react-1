# P3.2 Attribution Foundation

## Boundary

Trusted first-party evidence + observed touchpoints -> deterministic attribution observation -> evidence maturity gate -> human-readable attribution summary.

## Rules

- Attribution is descriptive, not causal.
- Only observed first-party touchpoints and outcomes may be used.
- Every input and output remains tenant-scoped by `workspaceId` and preserves campaign/content/evidence lineage when present.
- Missing or weak evidence must return `INSUFFICIENT_ATTRIBUTION_EVIDENCE`; never fabricate touchpoints, outcomes, confidence, or channel impact.
- The initial model is deterministic explicit last-touch attribution only.
- Attribution output is human-review-only and non-executable.
- No automatic budget reallocation, campaign mutation, publishing, provider calls, or production-side effects.
- Do not derive LTV/CAC/ROAS or causal lift from this foundation.
- Deterministic ordering is required for equal timestamps and stable test evidence.

## Acceptance evidence

P3.2 is complete only when the focused executable verifier passes and `test:p3-2` is enforced in the PR3 gate together with all prior regression, typecheck, build, and RLS gates.