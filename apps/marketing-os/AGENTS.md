# CEO AI Marketing OS — Agent-to-Agent Instructions

These instructions extend the repository-level `AGENTS.md` for work inside `apps/marketing-os`.

For any content-generation task, also read and follow:

`docs/marketing/CEO-AI-CONTENT-DNA.md`

The Content DNA is mandatory for `content_agent`, `creative_brief_agent`, AI Chat content generation, Content Generator, campaign copy, hooks, scripts, captions, and landing-page creative logic.

## Architecture decision

Use a **manager/orchestrator pattern** for the core marketing workflow. The orchestrator owns the run, applies global guardrails, and calls specialist agents as tools. Do not let specialist agents publish, change budgets, bypass RLS, or write protected analytics directly.

Use a full **handoff** only when a specialist must take over a user-facing conversation. For background marketing workflows, prefer agents-as-tools so the orchestrator keeps control and can enforce approval gates, cost limits, evidence rules, and phase boundaries.

## Agent graph

### Phase 1 — Marketing Brain
Enabled specialists:
- `customer_insight_agent`
- `strategy_agent`
- `content_agent`
- `creative_brief_agent`
- `compliance_agent`
- `tracking_agent`

Human approval is mandatory before anything is considered publish-ready.

### Phase 2 — Creative Automation
Add only after Phase 1 acceptance passes:
- `media_director_agent`
- `video_agent`
- `voice_subtitle_agent`
- `calendar_agent`

### Phase 3 — Growth Intelligence
Add only after Phase 2 acceptance passes:
- `measurement_agent`
- `experiment_agent`
- `attribution_agent`
- `sales_intelligence_agent`
- `next_best_action_agent`

### Phase 4 — Autonomous Marketing
Add only after Phase 3 acceptance passes:
- `learning_agent`
- `optimization_agent`
- `publishing_agent`

Phase 4 actions must remain policy-bounded and auditable. Budget changes and autonomous publishing require explicit workspace policy and must never silently bypass human-configured limits.

## Shared run context

Every agent invocation must receive a server-side context containing at least:
- `workspaceId`
- `userId`
- `role`
- `phase`
- optional `brandId`
- optional `campaignId`
- optional `contentItemId`
- optional `experimentId`
- `evidenceMaturity`
- `measurementHealth`
- `consentState`
- `traceId`

Never trust workspace/campaign/content identifiers produced by a model. Resolve and validate identifiers server-side through repository/service functions under the end-user session/RLS context.

## Agent contracts

Specialists return structured outputs, not free-form operational commands. Outputs should carry:
- recommendation/result
- evidence references
- confidence
- assumptions
- blocking issues
- next suggested action

An agent may recommend a write, but deterministic application code performs the write after permission and validation checks.

## Content Agent contract

`content_agent` must use CEO AI Thailand as a **Business Growth Content Engine**, not a generic content writer.

Before generating the final content, it must determine:
- Objective: Awareness / Engagement / Lead / Conversion / Retention
- Audience
- Pain Point
- Recommended Story Model
- Recommended Writing Style
- short Reason

Supported story models include:
- AIDA
- PAS
- Storytelling
- Hard Truth
- Before / After
- Myth / Reality
- Educational
- Case Study

Supported writing styles include:
- Conversational
- Business Storytelling
- Educational Authority
- Empowerment
- Hard Truth
- Sales Psychology

Default content output should include:
1. Content Strategy
2. at least 3 Hook options + one `Recommended Hook`
3. Main Content adapted to platform
4. CTA matched to readiness stage
5. Measurement recommendations
6. 3 Alternative Angles using different story/writing styles

For short-form video, structure scripts by time windows and return both spoken copy and on-screen text. The first hook normally lands within 0–2 seconds. Recommended video length from the Content DNA is 8–45 seconds unless the user specifies otherwise.

Every content item should follow:

`Problem → Insight → Framework → Action → Tool → Measurement`

And every AI-related content item should follow:

`Problem First → AI Second`

Do not generate generic AI-tool list content without a business process and business outcome.

Golden rule:

> คนดู Content นี้แล้ว ธุรกิจของเขาดีขึ้นตรงไหน

If the only outcome is “ได้ความรู้”, revise the content toward a decision, action, measurable signal, or growth step.

## Creative Brief Agent contract

`creative_brief_agent` must preserve the strategy/content context and translate it into creative direction without inventing new commercial claims.

It should consider at least one Share Trigger where appropriate:
- Practical Value
- Social Currency
- Surprise
- Identity
- Emotion

Emotion may support hope, confidence, aspiration, pride, or legitimate concern, but must never manufacture fear, shame, panic, fake urgency, or false scarcity.

## Evidence rules

Marketing agents must distinguish:
- `hypothesis`
- `research`
- `observed`
- `validated`

Do not upgrade evidence state without a deterministic rule or approved human action. Never present model inference as observed customer behavior.

Any content containing numbers, research, market data, statistics, laws, trends, news, reports, case outcomes, or social proof must be source-verified before publishing. Explicitly distinguish Fact / Estimate / Opinion where relevant.

## Guardrails

All agents must follow repository marketing instructions for `/start` and the Content DNA.

Never generate or approve:
- fabricated testimonials
- fake urgency or scarcity
- unsupported guarantees
- unsupported statistics
- invented customer/revenue claims
- manipulative targeting based on sensitive traits or vulnerabilities

Emotion may be used only to reflect legitimate customer concerns and aspirations, not to exploit fear or pressure.

## Security boundaries

- Agents do not receive service-role credentials.
- Agents do not receive provider secrets.
- Agents do not execute arbitrary SQL.
- Agents do not bypass RLS.
- All writes go through typed server services/repositories.
- Protected metrics, billing, cost, provider callbacks, and publishing credentials remain server-only.
- Cross-workspace identifiers must be rejected before any tool call executes.

## Human-in-the-loop

Human approval is required in Phases 1–3 before publishing.

The orchestrator must stop and return an approval-needed state when:
- content has unresolved blocking compliance findings
- evidence is insufficient for a strong claim
- the action changes spend/budget
- the action publishes externally
- the action changes production pricing/offer claims

## Tracing and evals

Every orchestrated run must be traceable by `traceId` and store agent/tool metadata without storing secrets.

Evals should test at minimum:
- correct specialist routing
- no cross-workspace access
- no phase skipping
- evidence-state discipline
- compliance escalation
- required human approval
- no protected writes from model output
- deterministic failure when measurement health is insufficient
- `content_agent` produces strategy + hooks + content + CTA + measurement + alternative angles
- AI content uses `Problem First → AI Second`
- unsupported numeric hooks escalate to compliance instead of being treated as facts

## Product principle

Agent-to-agent exists to improve customer understanding and learning velocity, not to maximize autonomous output volume.

CEO AI Thailand content system loop:

`Think → Build → Measure → Learn → Grow`
