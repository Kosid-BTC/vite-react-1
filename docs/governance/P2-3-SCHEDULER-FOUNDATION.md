# P2.3 Scheduler Foundation

Status: AUTHORIZED / NON-PRODUCTION ONLY

## Objective
Establish the final Phase 2 scheduler boundary without publishing to any external channel.

Canonical flow:

`Approved Calendar Entry -> Schedule Request -> Deterministic Schedule Record -> Human Review -> External Publisher (future boundary)`

## Invariants
- Input must preserve `workspaceId`, `campaignId`, `contentItemId`, `sourceAssetId`, calendar entry id, channel, and planned timestamp lineage.
- Scheduling is a provider-neutral domain contract only; P2.3 must not call social APIs, provider SDKs, webhooks, queues, or production callbacks.
- A calendar entry must be explicitly human-approved before a schedule record can be created.
- Schedule records remain `publishable: false`, `executable: false`, and `approvalRequired: true`.
- Scheduling identity must be deterministic from tenant/channel/time/content lineage so duplicate schedule requests are rejected.
- No retry loop may autonomously publish or mutate a campaign, landing page, pricing, budget, or content.
- No provider secret may be exposed to browser-facing contracts.
- No remote production Supabase mutation, remote SQL/migration/db push, production deploy, or `main` merge.

## PASS evidence
- focused executable test for approved-only scheduling
- unapproved calendar entries rejected
- deterministic schedule identity
- duplicate schedule rejection
- lineage preservation
- no client-secret surface
- `publishable:false`, `executable:false`, human approval retained
- existing P1.3/P1.4/P2.0/P2.1/P2.2 and Phase 1 regressions remain green
- typecheck/build/lint/diff remain green
