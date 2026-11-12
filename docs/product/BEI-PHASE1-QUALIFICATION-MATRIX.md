# BEI Phase 1 — Qualification and RLS test matrix

## State
- Draft PR only. The UI component is **not mounted** in App.tsx or Root.tsx.
- Schema SQL is under docs/architecture and **must not be executed** against an existing project.
- No production data write, Supabase project restoration, plan upgrade, or Vercel deploy.

## Required integration sequence
1. Review model/rubric with actual SME pilot observations. BES is not a survival prediction.
2. Use an isolated local Supabase environment. Generate the migration filename with the installed Supabase CLI after checking CLI help/version.
3. Adapt the review SQL into that migration; verify workspace role functions exist in the target environment.
4. Run database tests with two distinct workspaces (A/B) and real authenticated users (owner, editor, reviewer, viewer, outsider).
5. Mount the Thai assessment component **only after** the approved persistence adapter, authentication and UX flow exist.
6. Confirm keyboard navigation, labels, screen reader alerts, Thai mobile layouts and 0/100 boundary handling.
7. Run npm run test:run, npm run build, npm run lint, and full CI. Record actual outputs.
8. Verify no regression in /start, onboarding, Marketing OS V4 and existing workspace flows.

## Mandatory authorization matrix
| Actor | Read own workspace | Append own workspace | Read/append other workspace | Update/Delete |
| --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Denied | Denied |
| Admin | Yes | Yes | Denied | Denied |
| Editor | Yes | Yes | Denied | Denied |
| Reviewer | Yes | Denied | Denied | Denied |
| Viewer | Yes | Denied | Denied | Denied |
| Nonmember | Denied | Denied | Denied | Denied |
| Anon | Denied | Denied | Denied | Denied |

## Negative tests
- Mismatched workspace_id or dimension between rating and evidence must fail FK.
- Cross-workspace reference must fail even when the attacker knows the evidence UUID.
- Spoofed recorded_by must fail.
- Consent=false and invalid dimension/source/score must fail CHECK.
- No partial BES should appear when a dimension lacks eligible evidence.
- Critical liquidity warning must show regardless of BES.
- Untrusted self-reported evidence must never be labeled independently verified.
- A user changing roles loses write permission on the next authorized request.
- Verify function grants and security-definer posture of legacy workspace helpers.

## Evidence handling
Keep evidence references internal and non-sensitive. Do not upload raw statements, bank data, secrets, IDs or personal records in this pilot. Define retention, lawful basis, consent provenance and deletion obligations before production. Append-only history may conflict with erasure obligations; design a controlled retention/redaction workflow with auditable authorization before release.

## Acceptance gate
- CI + database RLS tests + pilot UAT + privacy/security review all PASS.
- Reviewer confirms versioned scoring rubric and source lineage.
- Production deployment requires separate explicit approval.
