# CEO AI Thailand Marketing OS — Codex Functional V5 Work Order

## Mission
Convert the approved V4 UX/UI into a truthful, functional Marketing OS. Every visible affordance must either execute a supported workflow or display an explicit truthful state such as `LIVE`, `CONNECTED`, `EMPTY`, `NEED SETUP`, or `UNAVAILABLE`.

## Release surface
- Repository: `Kosid-BTC/vite-react-1`
- App: `apps/marketing-os`
- Base: `feat/marketing-os-phase1`
- Working branch: `feat/marketing-os-functional-v5`
- Approved visual contract: `APPROVED_UI_V4_SOURCE.md`
- Authoritative Vercel project: `ceo-ai-marketing-os`
- Supabase: `CEOAITHAILAND Marketing` (`bjozpwdtqbpwcxnqguka`)

## Product loop
`Observe → Understand → Decide → Create → Approve → Publish → Measure → Learn`

## Required functional scope
1. Preserve approved V4 dashboard hierarchy and responsive behavior.
2. Replace generic feature placeholders with real Supabase-backed read states for:
   - Audience
   - Message Pillars
   - Brand Guardrails
   - Content Calendar / Content Items / Content Library
   - Review & Approve
   - Channels
   - UTM & Tracking
   - AI job queues for Text→Image / Text→Video / Image→Video
   - Next Best Actions
   - Business Genome / workspace state
   - MIT 24 Steps / workspace state
   - Production Readiness
3. Campaign list and Campaign creation must be workspace/RLS scoped and use real Supabase records.
4. Analytics modules must never fabricate metrics. If a verified measurement source is absent, render `UNAVAILABLE` with a reason.
5. Keep Account/Auth behavior from PR #13.
6. Preserve human approval before publishing, spend, or external mutations.
7. No direct Production deployment in this branch.

## Existing backend evidence
Current schema already includes `workspaces`, `workspace_state`, `marketing_brands`, `marketing_audience_segments`, `marketing_message_pillars`, `marketing_brand_rules`, `marketing_campaigns`, `marketing_content_items`, `marketing_content_versions`, `marketing_content_assets`, `marketing_approval_requests`, `marketing_tracking_links`, `marketing_action_items`, `marketing_ai_jobs`, `channels`, and related tables.

The `ceo-ai-thailand` workspace currently has no strategy/campaign/content rows. Production UX must therefore use truthful empty states instead of sample or fabricated data.

## Guardrails
- Do not merge to `main`.
- Do not mutate Production from development work.
- Do not change Supabase security/auth policies in this workstream.
- Do not auto-publish or change ad spend.
- Release path: branch → PR → CI → authoritative Vercel Preview → visual/interaction QA → explicit Production approval.

## Required gates
- `npm run typecheck`
- `npm run build`
- interaction route contract
- authenticated workspace/RLS path validation
- authoritative `ceo-ai-marketing-os` Preview smoke
- approved V4 visual regression

## Definition of done
No deceptive inert controls remain. Every visible dashboard action is functional or explicitly unavailable, all live data is workspace scoped, and VERIFIED vs UNVERIFIED backend execution is documented per feature.
