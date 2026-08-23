# Dark AI Marketing — System Design Mapping

> Basis: user-provided synthesis of 25 lessons. This document is a product-design interpretation, not an independent verification or chapter-by-chapter summary of the book.

## Purpose

Use the synthesis as a design input for CEO AI Marketing OS while preserving ethical constraints, first-party data discipline, human oversight, evidence quality and the four-phase delivery plan.

## Strategic interpretation

The platform should compete on customer understanding and learning velocity rather than content volume or ad spend alone.

Core loop:

`First-party Evidence → Customer Insight → Hypothesis → Creative Variant → Distribution → Behavior → Conversion/Retention → Learning → Next Best Action`

## What changes in the product architecture

### Customer Intelligence

Add/maintain structured fields for:
- jobs to be done
- pains
- anxieties
- desired outcomes
- buying triggers
- objections
- search intent
- observed behaviors
- evidence status
- evidence source
- confidence

Do not collapse these into a static persona narrative.

Dynamic persona updates belong to Phase 3 after analytics and evidence quality are mature.

### First-party Data

The Marketing OS should prefer:
- website/product events
- CTA interactions
- calculator/assessment completion
- signup/activation behavior
- campaign/content attribution
- repeat visits
- retained usage
- verified revenue/subscription outcomes

Avoid purchased audience data as a core dependency.

Privacy rules:
- consent-aware collection
- no sensitive-trait profiling for marketing optimization
- no browser-side protected metric fabrication
- tenant isolation through RLS
- retention and purpose limitation

### Personalization

Personalize by legitimate first-party context such as:
- segment
- journey stage
- completed actions
- campaign/source
- explicit business goal
- current business maturity
- prior content/offer interaction

Do not personalize using hidden vulnerability exploitation or sensitive personal traits.

When evidence is weak, fall back to segment-level messaging rather than pretending individual certainty.

### Creative psychology

Emotion can inform messaging when it reflects a real customer situation.

Allowed examples:
- uncertainty before investing
- hope of creating additional income
- confidence from having a step-by-step process
- fear of wasting time or budget when stated responsibly

Prohibited:
- manufactured panic
- false deadlines
- fake scarcity
- shame-based manipulation
- guaranteed success
- unsupported financial promises

### Social proof

Only use evidence-backed proof:
- verified review
- verified case study
- real usage statistic with source/date/method
- transparent product demonstration
- observed calculator/assessment outcomes where appropriate

Never generate synthetic testimonials or imply endorsements that do not exist.

## KPI architecture

Use a layered KPI tree instead of traffic-only reporting.

### Acquisition / Exposure
- impressions
- reach
- content views
- landing views

### Attention
- watch time
- completion
- scroll depth
- engaged time
- saves/shares where available

### Intent
- CTA views/clicks
- calculator starts/completions
- assessment starts/completions
- pricing views

### Activation
- signup started/completed
- onboarding completed
- first value action completed

### Revenue
- qualified lead
- trial
- paid conversion
- revenue
- subscription start

### Retention / Value
- active return
- repeat usage
- retained subscription
- expansion
- cohort retention
- LTV only when data quality supports it

## Data maturity rules

Do not optimize from a metric merely because it exists.

Before using Conversion / CPA / ROAS / CAC / LTV / retention conclusions:
1. verify Measurement Health
2. verify attribution coverage
3. verify event definition stability
4. verify adequate sample/cohort maturity
5. distinguish observed data from assumptions

When immature, show counts and directional evidence instead of false precision.

## Experimentation

AI can accelerate variant production, but evidence discipline remains mandatory.

Experiment dimensions:
- hook
- message
- thumbnail
- creative style
- CTA
- offer
- video duration
- landing hero

Prefer one principal variable per experiment where practical.

Every experiment should store:
- hypothesis
- audience
- variable under test
- control
- variants
- primary outcome
- supporting metrics
- minimum evidence rule
- decision status

Do not auto-declare winners below evidence thresholds.

## Marketing stack contract

All major objects should share IDs and lineage:

`Workspace → Brand → Audience → Campaign → Experiment → Content → Asset → Publish → Event → Lead/Customer → Insight`

Provider integrations must be replaceable through adapter/registry contracts.

## AI role

AI is a decision-support and production layer.

It may:
- research
- summarize
- identify patterns
- generate hypotheses
- generate content variants
- rank options
- identify bottlenecks
- recommend next actions

It should not autonomously:
- approve unsupported claims
- invent evidence
- increase budgets without policy limits
- publish during Phases 1–3 without human approval
- declare strategic certainty when Measurement Health is weak

## Phase mapping

### Phase 1 — Marketing Brain
Implement now:
- first-party attribution identifiers
- evidence-aware audience/persona model
- campaign hypotheses
- content metadata
- prompt/model/version lineage
- brand/compliance guardrails
- human approval
- UTM/tracking foundation

Do not add predictive persona scoring yet.

### Phase 2 — Creative Automation
Implement:
- text-to-video
- image-to-video
- voice/subtitles
- creative repurposing
- calendar/scheduler
- campaign-aware creative personalization

Human approval remains mandatory.

### Phase 3 — Growth Intelligence
Implement:
- analytics
- dynamic persona updates based on observed behavior
- experiment engine
- first/last/assisted attribution
- lead/sales intelligence
- retention and mature unit-economics metrics
- Next Best Action

### Phase 4 — Autonomous Marketing
Implement only after prior phases prove reliable:
- learning engine
- automatic campaign recommendations
- constrained content/budget optimization
- controlled autonomous publishing

All autonomous actions require policy boundaries, auditability and measurable rollback conditions.

## `/start` implications

The public page should emphasize progress for aspiring entrepreneurs rather than generic AI capability.

Preferred message direction:
- understand who may buy before investing heavily
- validate a business idea
- identify first customer
- build from evidence
- grow into systems/process/KPI later

Avoid using ISO as the default acquisition message for general traffic.

Preferred CTA logic:
- early-stage visitor → idea/business validation
- product/cost-aware visitor → profit calculator
- growth business → process/KPI/system assessment
- explicit audit intent → ISO/compliance route

## Core principle

The platform should optimize for:

**better decisions from better first-party evidence**

—not merely more AI-generated content.