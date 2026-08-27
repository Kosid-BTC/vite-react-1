# Search Ownership Continuous Improvement Loop

Status: implementation baseline

Canonical entity: **CEO AI Thailand**

Decision: **PROCEED_WITH_CONTROLS**

## Why this exists

The Search Ownership program starts from a brand-confusion signal: search systems can interpret `ceoaithailand` as a broad semantic cluster around CEO + AI + Thailand instead of resolving it to one brand entity.

The product decision is to turn that ambiguity into an evidence-led growth opportunity rather than escape adjacent semantic space or use keyword stuffing.

## Loop

```text
Google Brand Confusion
        ↓
Crisis → Opportunity Classification
        ↓
Semantic Decomposition
BRAND / CATEGORY / PROBLEM / ADJACENT
        ↓
Risk / Opportunity Assessment
        ↓
PROCEED_WITH_CONTROLS
        ↓
Canonical Entity Control
        ↓
Search Ownership
        ↓
Category Ownership
        ↓
Entity Confusion Index (ECI)
        ↓
Growth Core Evidence
        ↓
Diagnosis
        ↓
Next Best Action
        ↓
Human Decision
        ↓
Controlled Action
        ↓
Measurement
        ↓
Learning
        └──────────────→ next observation cycle
```

## Current repository audit

The repository package is already named `ceo-ai-thailand` and uses React + TypeScript + Vite. The build script runs TypeScript, Vite, and an SEO prerender step. Preserve this architecture for this workstream.

The Cloudflare Worker in `src/server.ts` already provides server-side SEO behavior including `/sitemap.xml`, `/llms.txt`, `/faq`, `/mit24`, homepage schema injection, and dynamic marketplace SEO. Do not build a second SEO runtime.

`src/lib/seoData.ts` is documented as the shared SEO source of truth for Worker and client. The new Entity Registry should be consolidated into this existing flow rather than leaving duplicated brand strings long-term.

## Phase plan

### Phase A — Repository skill + durable instructions

- `.agents/skills/ceoai-search-ownership/SKILL.md`
- root `AGENTS.md`

Purpose: make the strategic rationale, evidence rules, cycle, and verification repeatable for Codex.

### Phase B — Entity Registry + deterministic domain engine

Initial implementation:

- `src/lib/searchOwnership.ts`
- canonical entity registry
- Search Ring classifier
- ECI v1
- deterministic diagnosis
- deterministic NBA proposal mapping
- explicit cycle states

Next consolidation task: make `seoData.ts`, homepage metadata, Entity Hub, and structured-data builders consume the canonical Entity Registry rather than duplicate brand identity strings.

### Phase C — Search Evidence

Add trusted evidence contracts and provider ingestion boundaries.

Required principles:

- GSC/SERP metrics are provider/server evidence.
- browser clients cannot fabricate trusted metrics.
- every observation has workspace, source, time, provenance, and reliability.
- missing evidence remains `INSUFFICIENT_DATA` or `UNAVAILABLE`.

Before schema work, inspect existing Supabase Marketing Measurement/Growth Core tables and reuse them.

### Phase D — Growth Core / NBA integration

Map Search Evidence into the existing chain:

`Observation -> Evidence -> Diagnosis -> NBA Proposal -> Human Decision -> Action -> Outcome -> Learning`

Do not create a parallel recommendation engine.

### Phase E — Search Health Dashboard

Law-of-UX hierarchy:

1. Entity Recognition
2. Search Ownership
3. Qualified Demand
4. Main Problem
5. Why It Matters
6. Next Best Action
7. one primary CTA

Advanced metrics are progressive disclosure.

### Phase F — Improvement learning loop

Persist action hypothesis, review window, outcome, reliability, and learning. Feed validated learning into the next cycle without rewriting historical evidence.

## ECI v1

```text
EntityStrength =
  0.30 * BrandConsistency
+ 0.25 * StructuredEntityConsistency
+ 0.20 * OwnedSerpCoverage
+ 0.15 * BrandedQueryDominance
+ 0.10 * AssociationAccuracy

ECI = 100 - EntityStrength
```

Lower ECI is better.

- 0–20 CLEAR
- 21–40 LOW_CONFUSION
- 41–60 CAUTION
- 61–100 HIGH_CONFUSION

No complete evidence = no ECI number.

## Business outcome model

Search ranking is not the north star.

```text
Search Visibility
    ↓
Qualified Visit
    ↓
Intent Event
    ↓
Activation
    ↓
Lead
    ↓
Customer
    ↓
Learning
```

## Content automation rule

Use:

`Evidence -> Search Intent -> Existing Content Gap -> Unique Insight -> Useful Content -> Human Review -> Publish -> Measure`

Do not use:

`Keyword -> mass generation -> automatic publication`

Search evidence may drive Article, Short Post, Carousel, Text-to-Image, Text-to-Video, Image-to-Video, and YouTube/Social derivatives, but asset lineage must be preserved.

## Known audit items for the next implementation pass

1. Consolidate canonical brand strings in `seoData.ts` into the Entity Registry.
2. Create/confirm one canonical Entity Hub and include it in sitemap/structured-data relationships.
3. Audit all `sameAs` values and include only verified official properties.
4. Audit SEO-visible factual claims in `llms.txt`, homepage copy, structured data, pricing, review/rating data, and social proof. Mark each as VERIFIED / NEEDS_EVIDENCE / REMOVE_OR_REWRITE.
5. Inspect Supabase schema before adding Search Evidence or improvement-cycle tables.
6. Preserve existing marketplace SEO and real-review guardrails.

## Verification

Run before completion:

```bash
npm run lint
npm run test:run
npm run build
```

Production deployment and production database mutations are outside this branch unless explicitly authorized.