# CEO AI Thailand — Codex Repository Instructions

## Product identity

Canonical brand name: **CEO AI Thailand**.

Do not rename the canonical brand to CEOAIThailand, CEO AI, CEO Thailand AI, CEO Thailand, or other variants. `ceoaithailand`, `CEOAIThailand`, and `CEO AI ไทย` are aliases/query variants only.

## Search Ownership / Entity Intelligence

For any task involving SEO, GEO/AEO, Search Console, SERP evidence, branded search, Entity SEO, Category Ownership, Entity Confusion Index (ECI), search-driven content, structured data, Search Health, or Search-derived Growth Core/NBA work, load and follow:

`.agents/skills/ceoai-search-ownership/SKILL.md`

The required improvement loop is:

`Google Brand Confusion -> Crisis-to-Opportunity -> Semantic Decomposition -> Risk/Opportunity -> PROCEED_WITH_CONTROLS -> Canonical Entity -> Search Ownership -> Category Ownership -> ECI -> Growth Core -> NBA -> Controlled Action -> Measurement -> Learning -> Next Cycle`

Search is a Growth Core sensor, not a standalone SEO subsystem.

## Architecture preservation

Inspect the repository before changing architecture. The current application is React + TypeScript + Vite with Cloudflare Worker/server SEO behavior and Supabase integration. Do not migrate frameworks as part of Search Ownership work unless explicitly requested.

Reuse existing SEO source-of-truth modules, Measurement contracts, and Growth Core concepts before adding parallel systems.

## Safety and evidence

- Never fabricate GSC, SERP, ranking, CTR, customer-count, rating, review, award, or authority evidence.
- Missing evidence must remain `INSUFFICIENT_DATA` or `UNAVAILABLE`.
- AI may observe, diagnose, and propose; it must not approve its own material strategic changes.
- Prefer forward-only migrations and preserve RLS/multi-tenant boundaries.
- Do not deploy or mutate production unless explicitly requested.

## Verification

Before reporting implementation complete, use the repository's existing scripts:

- `npm run lint`
- `npm run test:run`
- `npm run build`

Report failures rather than hiding them.