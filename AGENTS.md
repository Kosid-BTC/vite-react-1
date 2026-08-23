# CEO AI Thailand — Marketing OS Instructions

## Source of truth

For all work related to `https://ceoaithailand.org/start` and CEO AI Marketing OS, use these rules before legacy copy in the repository.

### Primary acquisition audiences
1. `employee` — salaried workers who want to start a side business or add income.
2. `graduate` — new graduates who want to start a business.
3. `newbie` — people who want to start a business but do not know where to begin.
4. `growth` — existing sellers/owners who want systematic growth; secondary segment.
5. `audit` — ISO/standard/compliance intent; side-door segment only.

### Message hierarchy
- Lead with the business problem and desired progress, not ISO and not generic AI claims.
- Core journey: Idea → Customer → Validation → Offer → Pricing → First Customer → Profit → Process → KPI → System → Scale.
- ISO/standards/PDPA become relevant downstream or when explicit search intent indicates `audit`.
- Do not use unsupported superlatives, guarantees, fabricated testimonials, fake scarcity, fake urgency or unverifiable statistics.
- Do not treat old 35–65 audience observations as the intended target market.

### CTA hierarchy
- General acquisition: idea/business validation first.
- Profit calculator is appropriate when the user already has a product/cost context.
- Every destination link must preserve attribution metadata: `seg`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and relevant campaign/content IDs.

## Delivery phases

### Phase 1 — Marketing Brain
Multi-tenant/RLS → Brand Strategy → Audience/Persona → Campaign/Hypothesis → Content Text → Image → Approval → UTM/Tracking.

### Phase 2 — Creative Automation
Text-to-Video → Image-to-Video → Voice/Subtitles → Content Calendar → Scheduler.

### Phase 3 — Growth Intelligence
Analytics → Experiment Engine → Attribution → Lead/Sales Intelligence → Next Best Action.

### Phase 4 — Autonomous Marketing
Learning Engine → automatic campaign recommendations → budget/content optimization → controlled autonomous publishing.

Do not start a later phase until the prior phase acceptance criteria pass.

## UX constraints
- Thai-first, mobile-first, Kanit primary font.
- One screen = one primary goal and one dominant CTA.
- Use progressive disclosure; hide provider/model tuning in Advanced Settings.
- Home is an Action Dashboard, not a graph dump.
- Long AI jobs must be resumable and report progress/status.
- Every screen should answer: “ฉันควรทำอะไรต่อ?”
- Human approval remains mandatory before publishing during Phases 1–3.

## Security constraints
- Every tenant-owned table carries `workspace_id`.
- Enable RLS on every tenant-owned public table.
- Use composite `(id, workspace_id)` foreign keys where a cross-table tenant reference exists.
- Never expose Supabase service-role or AI provider secrets to the browser.
- Do not use service-role to bypass normal user CRUD.
- Provider callbacks, usage metering, protected analytics and secrets are server-only.
- Do not weaken RLS to make UI code pass.
