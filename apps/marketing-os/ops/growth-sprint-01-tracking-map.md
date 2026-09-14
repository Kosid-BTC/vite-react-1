# Growth Sprint 01 — Tracking Map

## Canonical Campaign Codes
- A: `ads-dependency`
- B: `pricing-margin`
- C: `ai-team-sme`

## UTM Contract
Use lowercase kebab-case.

- `utm_source`: publishing channel, e.g. facebook, tiktok, youtube, line
- `utm_medium`: organic-social, short-video, community, email
- `utm_campaign`: `g01-ads-dependency`, `g01-pricing-margin`, `g01-ai-team-sme`
- `utm_content`: asset identifier, e.g. `d1-hook-v1`, `d2-proof-v1`

Example:
`https://ceoaithailand.org/?utm_source=facebook&utm_medium=short-video&utm_campaign=g01-ads-dependency&utm_content=d1-hook-v1`

## Funnel Events
1. `landing_view`
2. `primary_cta_click`
3. `signup_started`
4. `signup_completed`
5. `workspace_activated`
6. `first_value_completed`
7. `lead_created`
8. `conversion_recorded`

## Required Evidence Per Event
Every event should retain, where available:
- timestamp
- workspace/user anonymous or authorized identifier according to current privacy model
- campaign code
- source / medium / content
- destination or route
- evidence source

## Decision Metrics
- CTR = primary_cta_click / landing_view or channel click denominator when evidenced
- Signup CVR = signup_completed / landing_view
- Activation Rate = workspace_activated / signup_completed
- First Value Rate = first_value_completed / signup_completed
- Lead Rate = lead_created / signup_completed
- Conversion Rate = conversion_recorded / signup_completed

If a denominator or numerator is not evidenced, mark the metric `UNAVAILABLE`.

## Daily Review Matrix
For each campaign:
- Traffic signal
- Signup signal
- Activation signal
- Lead/conversion signal
- Decision: SCALE / ITERATE / STOP / UNAVAILABLE
- Next experiment

## Guardrail
Do not optimize on reach/views alone. Prefer the deepest evidenced downstream event available.