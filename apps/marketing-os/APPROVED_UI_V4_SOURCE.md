# CEO AI Thailand Marketing OS — Approved UX/UI V4

Authoritative visual source: ONLY the two user-approved Library images locked on 2026-09-27:

1. `IMG_1789.jpeg` — primary dashboard hierarchy: six KPI cards, Performance Overview, Traffic Sources, AI Recommendations, Business Genome, MIT 24 Steps, Recent Activity, and platform integrations.
2. `IMG_1788.jpeg` — supporting campaign/content detail: campaign performance, top-performing content, channels/integrations, content calendar, content factory, audience insights, AI insight, and next-best actions.

The 2026-09-27 pair supersedes earlier reference filenames recorded in older drafts, including `0D291464-3F4B-4AD2-B7BE-C5409EC56B4F(6).jpeg` and `4C6D6E63-535F-4E43-BD88-FD10F31624DC(4).jpeg`. Do not substitute generated mockups, Figma alternatives, older screenshots/concepts, Executive Growth mockups, duplicates, or rejected PR #8.

## Non-negotiable visual contract

- Light left sidebar with CEO AI Thailand branding and violet active state.
- White/light-gray SaaS canvas, violet primary accent, Kanit.
- Topbar/search/profile controls as applicable.
- Dense desktop layout at 1536px reference width.
- Primary dashboard order: topbar/search/profile → title/date/new campaign → greeting/connection health → all 6 KPI cards → Performance Overview → Traffic Sources → AI Recommendations after major analytics/performance content → Business Genome + MIT 24 Steps → Recent Activity → platform connections/status/footer.
- Supporting campaign/content surfaces must preserve the hierarchy and content language shown in `IMG_1788.jpeg`; do not force every detail panel into the primary dashboard viewport.
- No arbitrary reordering on responsive layouts.
- Mobile acceptance viewport is 390x844 and preserves the same visual language and information hierarchy: brand/topbar → compact title/CTA → connection strip → all six KPI cards → Performance Overview first → Traffic Sources/remaining analytics → AI Recommendations → Business Genome → MIT 24 Steps → Recent Activity → platform connections/status.
- Do not hide KPI cards 5–6 on mobile.
- Do not promote AI Recommendations ahead of major analytics/performance content.
- Do not replace the agreed design with another dashboard concept.
- Production metrics without verified evidence remain `—`, `UNAVAILABLE`, or `UNVERIFIED`; visual fidelity never justifies fabricated data.

## Pre-production Authenticated Preview gate (mandatory)

Before any Production Acceptance or Production promotion, the exact candidate commit must be deployed as a **Preview** to the authoritative Vercel project `ceo-ai-marketing-os` (`prj_hfiFu2Ho2LQqSDlqy1oA0TaT4MWw`). A legacy-project check, a deployment with `target=null`, or a deployment for a different SHA is **FAIL**, not Preview evidence.

Required evidence on the exact SHA:

- An authenticated session protected by the authoritative project's SSO; use isolated Development test identities and synthetic Tenant A / Tenant B workspaces only.
- Desktop capture at 1536x1024 and mobile capture at 390x844 after authentication.
- Visual comparison against ONLY `IMG_1789.jpeg` and `IMG_1788.jpeg`; verify the complete six-KPI sequence and the agreed content order, including all six KPI cards on mobile.
- A sanitized evidence manifest containing exact Git SHA, authoritative Vercel project ID, deployment ID, `target=preview`, deployment URL, capture timestamp, tester identity, test result, and SHA-256 digests of both screenshots.
- No production customer data, access tokens, JWTs, cookies, API keys, or secrets in screenshots or evidence artifacts.

Fail closed if authentication, exact-SHA provenance, Tenant A/B context, screenshot evidence, or visual comparison is unavailable. A Preview PASS is a precondition only; it is not permission to promote or change Production. Production promotion requires a separate explicit approval after all Security and Integration gates pass.

## Mandatory UX/UI confirmation

After a separately approved Production promotion, capture and compare live Production evidence at Desktop 1536x1024 and Mobile 390x844 against ONLY the two locked uploads above and assert the required structure/order before declaring PRODUCTION COMPLETE.

## Release rule

READY FOR USE means Approved UX/UI V4 is actually running on Production AND all post-deploy gates pass. Vercel READY alone is insufficient.

No Production promotion until exact-SHA typecheck/build/regression gates and visual QA against the two locked uploads pass. After promotion, repeat runtime/auth/live smoke and Desktop/Mobile Production visual confirmation before declaring PRODUCTION COMPLETE / พร้อมใช้งาน.
