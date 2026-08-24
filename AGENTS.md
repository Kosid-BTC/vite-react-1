# CEO AI Thailand — Marketing OS Instructions

## Source of truth

For all work related to `https://ceoaithailand.org/start` and CEO AI Marketing OS, use these rules before legacy copy in the repository.

The detailed CEO AI Thailand Content & Marketing DNA is stored in:

`docs/marketing/CEO-AI-CONTENT-DNA.md`

For content generation, AI Chat, Content Generator, campaign copy, scripts, hooks, captions, landing-page messaging, and Marketing Automation, read and follow that document together with this file.

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
- Apply `Problem First → AI Second` from the Content DNA.
- Every content item must connect to `Business Problem → Action → Product → Measurement`.

### CTA hierarchy
- General acquisition: idea/business validation first.
- Profit calculator is appropriate when the user already has a product/cost context.
- Every destination link must preserve attribution metadata: `seg`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and relevant campaign/content IDs.
- Match CTA intensity to readiness stage; do not hard-sell every post.

## Ethical AI Marketing principles

The following principles are derived from the user's 25-point synthesis of “Dark AI Marketing”. Treat them as strategic design inputs, not as independently verified quotations or chapter summaries from the book.

### 1. Customer understanding beats media spend
- Competitive advantage should come from better customer understanding, first-party evidence and faster learning, not simply buying more reach.
- Optimize the system for learning velocity: research → hypothesis → experiment → evidence → decision.

### 2. First-party data is a core asset
- Prefer first-party behavioral and journey data over purchased audience data.
- Capture only data required for a defined product/marketing purpose.
- Respect consent, privacy, retention rules and RLS isolation.
- Never collect sensitive attributes merely to improve ad targeting.

### 3. Behavior is stronger evidence than declared preference
- Separate stated preference from observed behavior.
- Dynamic personas may update from real behavior, but must preserve an evidence trail and confidence level.
- Never silently convert an inferred trait into a fact.

### 4. AI is a decision-support system
- AI may analyze, rank, summarize, recommend and generate variants.
- Human users remain responsible for strategic approval, claims, budgets and publishing in Phases 1–3.
- Recommendations must expose evidence, confidence and data-quality limits.

### 5. Dynamic Persona architecture
- Persona records should support `hypothesis`, `research`, `observed`, and `validated` evidence states.
- Behavioral signals may update persona hypotheses over time.
- Do not overwrite the original research/history; preserve version/evidence lineage.

### 6. Ethical personalization
- Personalization should adapt message, offer, CTA, content depth and next best action using lawful, relevant first-party context.
- Avoid manipulative personalization, sensitive profiling, exploitative vulnerability targeting or hidden persuasion.
- Personalization must degrade gracefully when evidence is insufficient.

### 7. Emotion may inform creative, never deception
- Creative may acknowledge fear, hope, confidence, uncertainty and aspiration when relevant to the customer's real situation.
- Never manufacture fear, shame, panic, fake urgency or false scarcity.
- Urgency is allowed only when a real deadline or capacity constraint exists and is verifiable.

### 8. Social proof must be real and traceable
- Reviews, case studies and outcome claims require verifiable source/evidence.
- Do not fabricate testimonials, customer counts, revenue outcomes or implied endorsements.
- When no verified proof exists, use transparent product evidence such as calculator outputs, demos, process explanations or observed usage data.

### 9. Conversion is not the only objective
- Measure Exposure → Attention → Intent → Activation → Revenue → Retention.
- Do not optimize for traffic alone.
- Do not optimize short-term conversion at the expense of trust, retention or customer value.

### 10. LTV, CAC and Retention belong to mature measurement
- LTV/CAC/Retention are strategic metrics, but they must not be presented as authoritative when the sample or cohort data is insufficient.
- Under the project data-maturity gate, show counts and evidence before strong rate/economic conclusions.

### 11. Automation must add customer value
- Automation should reduce effort, improve relevance, surface next steps or increase response quality.
- Avoid repetitive low-value outreach, spam-like automation and frequency without value.
- Controlled automation is preferred over autonomous volume.

### 12. Connected marketing stack
- Strategy, content generation, media generation, publishing, CRM/lead state, analytics and learning should share common IDs and attribution metadata.
- Avoid isolated tools that break campaign/content/lead lineage.
- Provider abstraction is mandatory for AI/media vendors.

### 13. Prompt quality is part of the system, not a user burden
- Store/version prompt templates and generation metadata.
- Product UX should hide prompt engineering complexity for normal users.
- Advanced prompt/provider controls belong behind progressive disclosure.

### 14. Fast experimentation with evidence discipline
- AI may generate multiple variants quickly, but experiments should change one primary variable where practical.
- Do not declare a winner without adequate evidence.
- Winning attributes should feed the next generation cycle; losing variants should remain auditable.

### 15. Owned-channel resilience
- Website, first-party analytics, customer/lead data and reusable content assets are strategic owned infrastructure.
- Do not make the operating model dependent on a single social/ad platform.

## Content generation contract

When generating a new content item, the default reasoning/output flow is:

1. Pre-Content Analysis
   - Objective
   - Audience
   - Pain Point
   - Recommended Story Model
   - Recommended Writing Style
   - short Reason
2. Hook
   - generate at least 3 options
   - mark one `Recommended Hook`
3. Main Content
   - adapt to platform
   - for video, structure by time windows with spoken copy + on-screen text
4. CTA
   - match readiness stage
5. Measurement
   - recommend relevant metrics subject to Measurement Health/data-maturity gates
6. Alternative Angles
   - propose 3 distinct angles using different story/writing styles

Preferred content models include AIDA, PAS, Storytelling, Before/After, Myth/Reality, Hard Truth, Educational, and Case Study. Preferred writing archetypes include Conversational, Business Storytelling, Educational Authority, Empowerment, Hard Truth, and Sales Psychology.

Golden rule: if the content only gives knowledge but does not support a decision, action, data signal, or growth step, revise it.

CEO AI Thailand content loop:

`Think → Build → Measure → Learn → Grow`

## Marketing intelligence object

Every strategy/content recommendation should be traceable to a structured context similar to:

`Audience × Job/Pain × Trigger × Journey Stage × Message × Offer × CTA × Channel × Experiment`

Where possible persist:
- `audience_segment_id`
- `persona_id`
- `pain_point_id`
- `message_pillar_id`
- `offer_id`
- `cta_id`
- `campaign_id`
- `experiment_id`
- `variant_id`
- `evidence_status`
- `evidence_source`
- `confidence`
- `prompt_version`
- `provider`
- `model`

## Delivery phases

### Phase 1 — Marketing Brain
Multi-tenant/RLS → Brand Strategy → Audience/Persona → Campaign/Hypothesis → Content Text → Image → Approval → UTM/Tracking.

Phase 1 must establish the data/evidence foundation needed by later personalization and learning. Do not implement predictive scoring or autonomous optimization yet.

### Phase 2 — Creative Automation
Text-to-Video → Image-to-Video → Voice/Subtitles → Content Calendar → Scheduler.

Phase 2 may use campaign/persona context from Phase 1 to personalize creative variants, while preserving human approval and claim guardrails.

### Phase 3 — Growth Intelligence
Analytics → Experiment Engine → Attribution → Lead/Sales Intelligence → Next Best Action.

Phase 3 is where dynamic persona updates, funnel analysis, LTV/CAC/Retention when mature, behavioral segmentation, lead intelligence and recommendation scoring belong.

### Phase 4 — Autonomous Marketing
Learning Engine → automatic campaign recommendations → budget/content optimization → controlled autonomous publishing.

Phase 4 must remain bounded by data quality, consent, budget controls, human-configured policies and explicit autonomous-action limits.

Do not start a later phase until the prior phase acceptance criteria pass.

## UX constraints
- Thai-first, mobile-first, Kanit primary font.
- One screen = one primary goal and one dominant CTA.
- Use progressive disclosure; hide provider/model tuning in Advanced Settings.
- Home is an Action Dashboard, not a graph dump.
- Long AI jobs must be resumable and report progress/status.
- Every screen should answer: “ฉันควรทำอะไรต่อ?”
- Human approval remains mandatory before publishing during Phases 1–3.

## Measurement constraints
- First-party tracking is preferred for product/website behavior.
- Every funnel stage must have a defined event/KPI before it is optimized.
- Measurement Health must be evaluated before strategic recommendations are generated.
- If attribution coverage or tracking quality is weak, the system must say so instead of inventing certainty.
- Below the configured data-maturity threshold, prefer counts over Conversion Rate / CPA / ROAS / LTV-CAC conclusions.
- Preserve first-touch, assisted and last-touch context where available.
- Track retention and repeat value once cohort data is mature enough to support it.

## Security constraints
- Every tenant-owned table carries `workspace_id`.
- Enable RLS on every tenant-owned public table.
- Use composite `(id, workspace_id)` foreign keys where a cross-table tenant reference exists.
- Never expose Supabase service-role or AI provider secrets to the browser.
- Do not use service-role to bypass normal user CRUD.
- Provider callbacks, usage metering, protected analytics and secrets are server-only.
- Do not weaken RLS to make UI code pass.
