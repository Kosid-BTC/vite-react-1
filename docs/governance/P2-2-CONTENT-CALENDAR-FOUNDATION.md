# P2.2 Content Calendar Foundation

Status: AUTHORIZED / NON-PRODUCTION ONLY

## Objective
Create a tenant-scoped content calendar planning boundary after approved creative drafts. This slice is planning only and does not publish content.

## Invariants
- Preserve workspace, campaign, content item, and source asset lineage.
- Calendar entries are planning records only.
- Planned timestamps must be valid ISO-8601 instants.
- Reject duplicate workspace/channel/planned-instant conflicts.
- Entries require human approval and remain non-publishable.
- Do not implement external publishing in this slice.
- No remote production Supabase changes, production deploy, or main merge.

## PASS evidence
- executable lineage test
- deterministic chronological ordering
- invalid timestamp rejection
- duplicate conflict rejection
- human approval remains mandatory
- existing regressions remain green
- typecheck/build/lint/diff remain green
