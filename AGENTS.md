# CEO AI Thailand — Codex Repository Instructions

These instructions apply to the entire repository.

## Product goal
Build CEO AI Thailand as a production-quality Thai-first Business Builder + Marketing Growth Operating System. The marketing automation work must be implemented as a closed loop:

Strategy → Campaign → Content → Creative → Approval → Publish/Track → Measure → Experiment → Learn → Next Best Action.

Do not reduce the product to a generic AI content generator.

## Current repository reality
This repository currently uses Vite + React + TypeScript + Supabase. Do NOT migrate the framework while executing the marketing roadmap unless the user explicitly asks for a separate framework migration. Extend the existing architecture safely and incrementally.

Required verification after each implementation slice:

- `npm run lint`
- `npm run test:run`
- `npm run build`

Do not claim a phase is complete if these have not passed or equivalent CI evidence is unavailable.

## Marketing source of truth for `/start`
For `https://ceoaithailand.org/start`, the current marketing instructions override older landing-page copy, comments, seed data, or personas found in the codebase.

### Primary target segments
1. `employee` — salaried/employed people who want to start a business or add income.
2. `graduate` — newly graduated people who want to start a business.
3. `newbie` — people generally who want to start a business but do not know where to begin.

Secondary:
- `growth` — existing owners already selling and wanting systematic growth.
- `audit` — ISO/มอก./PDPA/Audit side-door intent only.

General traffic must NOT lead with ISO, audit, compliance, or management-system jargon.

### Core journey
Idea → Customer → Problem → Market Validation → Offer → Pricing → First Customer → Profit → Process → KPI/SOP → System → Scale.

MIT 24 Steps is the upstream business-building framework. Management systems / ISO are downstream scale-enablers.

### Messaging principles
Prefer business-first messages such as:
- อยากมีธุรกิจ แต่ไม่รู้จะเริ่มจากอะไร?
- ก่อนลงทุน ลองรู้ก่อนว่าใครจะซื้อ
- เปลี่ยนไอเดียธุรกิจให้เป็นแผนที่ทดลองได้จริง
- เริ่มธุรกิจจากลูกค้าคนแรก ไม่ใช่เริ่มจากการลงทุนก้อนใหญ่

Do not use “AI team/company” as the primary promise. AI is a mechanism supporting the business outcome.

### Claims guardrails
Never introduce or auto-generate unsupported claims, fabricated statistics, fabricated testimonials, fake urgency, fake scarcity, or guarantees.

Forbidden examples include:
- การันตี
- อันดับ 1 ของไทย
- ดีที่สุดในประเทศ
- ฟรีตลอดชีพ
- รับรองว่าได้ใบ
- fake countdowns / fake stock / fake social proof

Pricing, trial length, transaction fees, quotas, and commercial promises must come from current production billing/configuration rather than stale landing-page constants.

## Analytics and evidence rules
Marketing analytics must be evidence-first.

- Preserve existing GA4 integration; do not break or replace it blindly.
- First-party measurement is the attribution source for campaign/content identity.
- Every trackable marketing destination should preserve `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `seg` when applicable.
- Distinguish `hypothesis`, `research`, `observed`, and `validated` evidence.
- Broken or incomplete tracking must lower Measurement Health and block strategic AI conclusions.
- When the configured sample gate is not met, show counts and uncertainty; do not declare conversion-rate, CPA, ROAS, or experiment winners as reliable.
- Never fabricate missing analytics data.

## Multi-tenant security
Supabase RLS is the authorization source of truth.

- Every tenant-owned marketing record must be scoped by `workspace_id`.
- Never weaken RLS to make UI work.
- Never expose `service_role` or provider secrets to browser code.
- Normal user CRUD must use authenticated user context and RLS.
- Service-role/server execution is reserved for trusted ingestion, provider callbacks/workers, protected metrics, and other explicitly server-only flows.
- Cross-workspace foreign references must be prevented with DB integrity and/or validated server-side.

## Content model
Use one parent Content Item mental model. Script, caption, storyboard, image, video, voice, subtitle, thumbnail, and final exports belong to the same content lineage rather than becoming disconnected products.

Content versions should be immutable/versioned where possible so performance can be traced to the exact creative version.

## Media generation
The platform must support first-class:

- Text → Image
- Text → Video
- Image → Video

Use provider abstractions. Business logic must not depend directly on one vendor.

Preferred production flow for brand-sensitive campaigns:

Content Idea → Script → Storyboard → Text-to-Image keyframes → Human Review → Image-to-Video → Composition → Voice/Subtitles → Brand/Compliance Check → Human Approval.

Text-to-Video is also supported as a Quick Mode.

Generation jobs and composition jobs are distinct responsibilities. Long-running provider operations must use job states, idempotency, retry-safe handling, and server-side callbacks/polling as needed.

## UX principles
Apply Law-of-UX-first design:

- one primary action per screen/state
- progressive disclosure for provider/model/advanced parameters
- Action Dashboard before chart-heavy dashboard
- Next Best Action on each important screen
- large mobile-friendly CTAs
- resumable drafts and long-running jobs
- no dark patterns
- Kanit is the primary product font where the existing design system supports it

## Phase execution order
Do not skip ahead unless dependencies are already production-ready.

### Phase 1 — Marketing Brain
Multi-tenant/RLS → Brand Strategy → Audience/Persona → Campaign/Hypothesis → Content Text → Image → Approval → UTM/Tracking.

Exit criteria:
- authenticated workspace isolation proven
- current `/start` marketing instructions represented in strategy/guardrails
- campaign hypothesis can create content lineage
- text/image generation can create reviewable assets
- human approval exists
- UTM + `seg` tracking identity exists
- first-party tracking does not bypass consent/security rules

### Phase 2 — Creative Automation
Text-to-Video → Image-to-Video → Voice/Subtitles → Content Calendar → Scheduler.

Exit criteria:
- provider-neutral video queue
- source-asset lineage for image-to-video
- storyboard scene linkage
- voice/subtitle composition path
- calendar/schedule state separated from provider execution
- human approval remains required before publish

### Phase 3 — Growth Intelligence
Analytics → Experiment Engine → Attribution → Lead/Sales Intelligence → Next Best Action.

Exit criteria:
- Measurement Health is visible
- exposure/attention/intent/business metrics are separated
- experiment maturity gates prevent false winners
- first-touch / last-touch / assisted attribution structures exist
- lead intent / qualification state can drive a recommended next action
- insights cite stored evidence rather than invented reasoning

### Phase 4 — Autonomous Marketing
Learning Engine → automatic campaign recommendations → budget/content optimization → controlled autonomous publishing.

Exit criteria:
- autonomy is policy-controlled and auditable
- recommendations are evidence-gated
- budgets have hard guardrails/limits
- publishing automation has approval/kill-switch controls
- every autonomous action is traceable to evidence + policy + version

## Implementation discipline
Before editing a subsystem:
1. inspect existing code/schema and reuse it where appropriate;
2. preserve backward compatibility unless migration is explicitly part of the task;
3. add tests for tenant isolation, validation, lineage, and quality gates;
4. avoid duplicate analytics truth sources;
5. prefer narrow, reviewable commits/PRs over large rewrites.

When legacy code conflicts with these instructions, do not silently copy it forward. Mark it as legacy, migrate intentionally, or isolate it until verified.
