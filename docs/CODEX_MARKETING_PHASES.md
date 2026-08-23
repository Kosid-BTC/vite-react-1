# CEO AI Marketing Automation — Codex Phase Roadmap

Status date: 2026-08-23

This roadmap implements the four user-approved phases. `AGENTS.md` is authoritative for repository-wide execution rules.

## Current implemented foundation

Already present in the working branches / production Supabase foundation:

- multi-tenant workspace model and marketing RLS helpers
- marketing strategy/audience seed foundation
- `marketing_generation_jobs`
- `marketing_assets`
- `marketing_storyboard_scenes`
- `marketing_composition_jobs`
- generation types: text, text_to_image, text_to_video, image_to_video, text_to_audio
- first-party marketing event foundation
- Measurement Health foundation
- provider-neutral media queue contract
- Supabase Edge Functions: `marketing-track`, `marketing-generate`
- authenticated `/marketing-health`
- authenticated `/marketing-media`

Do not mark any phase complete only because a table or page exists. Validate end-to-end acceptance criteria.

---

# Phase 1 — Marketing Brain

Goal: convert marketing instructions into structured strategy, campaign hypotheses, reviewable content, image assets, approval, and trustworthy attribution.

## P1.1 Strategy source of truth

Implement or normalize:

- Brand Strategy
- Audience Segment
- Persona
- Jobs-to-be-Done
- Pain / Anxiety / Trigger / Objection
- Message Pillar
- Offer
- CTA
- Brand/Claim Guardrails
- Evidence status: hypothesis / research / observed / validated

Required `/start` seed logic:

- Primary: employee, graduate, newbie
- Secondary: growth
- Side door: audit
- general traffic = business-first, not ISO-first

Acceptance:

- UI can display and edit the active strategy for one workspace.
- Content generation references structured strategy IDs rather than copying free-text persona prompts only.
- Unverified research is visually distinguishable from validated evidence.

## P1.2 Campaign + hypothesis

Create a campaign wizard:

1. Goal
2. Audience
3. Pain/problem
4. Message hypothesis
5. Offer/CTA
6. Channel
7. Review

Initial goals:

- awareness
- interest
- first_customer
- sales

Store campaign hypothesis and decision rule.

Acceptance:

- campaign has `workspace_id` and strategy lineage
- invalid cross-workspace references are blocked
- campaign can create Content Items

## P1.3 Content Item + immutable versions

One Content Item is parent to:

- hook
- script
- caption
- storyboard
- images
- videos
- voice
- subtitles
- thumbnail
- final exports

Acceptance:

- create/edit creates version lineage rather than destructive overwrite for performance-relevant creative changes
- exact version can later be connected to analytics

## P1.4 Text generation

Build provider-neutral text generation for:

- campaign ideas
- hooks
- script
- caption
- CTA variants

Requirements:

- structured output
- prompt version logging
- model/provider logging
- brand guardrail check
- no unsupported claims
- max 3 recommended outputs in normal UX

## P1.5 Text-to-Image

Connect image generation to Content Item and Strategy context.

Required outputs:

- social creative
- thumbnail
- keyframe
- carousel image

Requirements:

- asset stored privately
- `workspace_id` isolation
- generation job → asset lineage
- aspect ratio metadata
- prompt/provider/model metadata
- human review

## P1.6 Approval

State flow:

Draft → Generated → Review → Approved / Changes Requested / Rejected

Acceptance:

- editor can generate
- reviewer role can approve where configured
- normal editor cannot self-bypass approval if campaign policy requires review
- blocking guardrail finding prevents approved/publish-ready state

## P1.7 UTM / Tracking

Every publishable content destination should have canonical tracking identity:

- campaign_id
- content_item_id
- experiment_id / variant_id where applicable
- utm_source
- utm_medium
- utm_campaign
- utm_content
- seg

Acceptance:

- tracking survives landing transition where relevant
- browser events remain consent-aware
- server-protected business outcomes are not browser-forgeable
- Measurement Health reports missing attribution

## Phase 1 DoD

User can:

Workspace → Strategy → Audience → Campaign Hypothesis → Content → Text → Image → Review → Approve → Tracking Link

and the lineage is queryable end-to-end.

---

# Phase 2 — Creative Automation

Goal: extend approved content into production-ready video and scheduling workflows without vendor lock-in.

## P2.1 Text-to-Video

Use `marketing_generation_jobs`.

Requirements:

- provider registry
- capability discovery
- aspect ratio / duration validation
- async status normalization
- retry/idempotency
- no fake completion state

## P2.2 Image-to-Video

Requirements:

- `source_asset_id` mandatory
- source image and generation job must belong to same workspace
- source image lineage retained on generated video asset
- motion prompt stored separately

## P2.3 Storyboard orchestration

Per scene:

- narration
- visual description
- image prompt
- video prompt
- motion prompt
- duration
- source image
- video output

Preferred Controlled Mode:

Text → Image keyframes → Review → Image-to-Video

## P2.4 Voice + subtitles

Separate jobs for:

- TTS
- transcription/alignment if required
- subtitle generation
- subtitle burn-in/composition

Store audio/subtitle assets in content lineage.

## P2.5 Composition

`marketing_composition_jobs` handles:

- merge clips
- voice
- subtitles
- logo/branding
- resize/crop
- 9:16 / 1:1 / 16:9 exports

Generation and composition remain separate.

## P2.6 Calendar + scheduler

Separate editorial intent from execution:

- content schedule record = planned publication
- publishing job = execution/retry/provider result

MVP may stop at schedule/export if a platform API is not ready.

Human approval remains mandatory.

## Phase 2 DoD

Approved Content Item → storyboard → text/image-to-video → voice/subtitle → composition → calendar/scheduled asset.

---

# Phase 3 — Growth Intelligence

Goal: convert marketing data into evidence-gated decisions and sales actions.

## P3.1 Analytics funnel

Separate:

Exposure → Attention → Intent → Lead → Trial → Customer

Do not collapse all performance into one score.

## P3.2 Measurement Health

Continue enforcing:

- UTM coverage
- campaign/content coverage
- attribution coverage
- event freshness
- ingestion failure
- sample/data maturity

If data quality is poor, show uncertainty instead of recommendations.

## P3.3 Experiment engine

Test one principal variable where practical:

- hook
- thumbnail
- CTA
- creative style
- video duration
- offer

Do not declare winner under minimum evidence.

## P3.4 Attribution

Support:

- first touch
- last touch
- assisted touchpoints

Keep raw journey evidence queryable.

## P3.5 Lead/Sales Intelligence

Lead lifecycle:

Visitor → Lead → Qualified → Activated → Trial → Customer → Retained

Store:

- segment
- source/campaign/content
- intent events
- qualification
- recommended next step

Do not invent lead qualification facts not supported by behavior/user input.

## P3.6 Next Best Action

Rule-first MVP, AI explanation second.

Examples:

- tracking unhealthy → fix tracking
- no campaign → create campaign
- high attention / low intent → test CTA/offer
- approved unscheduled content → schedule
- experiment immature → collect more evidence
- qualified lead inactive → sales follow-up task

## Phase 3 DoD

System can explain:

What happened → where the bottleneck is → how reliable the evidence is → what single action should be taken next.

---

# Phase 4 — Autonomous Marketing

Goal: controlled autonomy only after tracking, experiments, and policy enforcement are proven.

## P4.1 Learning Engine

Learn reusable workspace patterns:

Audience × Pain × Hook × Visual × Format × CTA × Offer × Channel

Only store learning when evidence quality meets policy.

## P4.2 Campaign recommendations

AI can propose:

- new campaign
- reuse winning hook
- change CTA
- create new creative variants
- pause weak hypothesis

Proposal != automatic execution by default.

## P4.3 Budget/content optimization

Guardrails required:

- explicit budget ceiling
- workspace policy
- minimum evidence threshold
- change limits per cycle
- rollback/kill switch
- audit log

## P4.4 Controlled autonomous publishing

Requirements:

- approved content policy
- channel permissions
- schedule windows
- rate limits
- kill switch
- audit trail
- failure/retry handling

Autonomy must be observable and reversible.

## Phase 4 DoD

Every autonomous action can answer:

- What evidence triggered it?
- Which policy allowed it?
- Which content/model/prompt version created it?
- What budget/risk limit applied?
- How can it be stopped or rolled back?

---

# Codex execution protocol

For each work item:

1. Inspect existing implementation first.
2. State what is already present vs missing.
3. Make the smallest production-safe change.
4. Add/adjust tests.
5. Run:
   - `npm run lint`
   - `npm run test:run`
   - `npm run build`
6. Report exact failures; never mark success without evidence.
7. Do not weaken RLS or bypass security with service-role CRUD.
8. Do not duplicate the existing analytics truth source.
9. Do not skip into Phase 4 automation before Phase 1–3 gates are real.

## Recommended immediate Codex task

Finish Phase 1 before adding more provider complexity:

1. audit existing Strategy schema/UI against current `/start` instructions
2. implement Campaign/Hypothesis lineage
3. connect text generation to structured Strategy IDs
4. finish Text-to-Image worker + private asset persistence
5. finish approval enforcement
6. finish canonical UTM/seg link generation
7. prove end-to-end lineage and RLS with tests

Only then promote the current media queue into full Phase 2 execution.
