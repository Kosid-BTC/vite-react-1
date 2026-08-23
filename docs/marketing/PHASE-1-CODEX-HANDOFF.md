# CEO AI Marketing OS — Phase 1 Codex Handoff

Active phase only: **Marketing Brain**.

## Implement now

1. Apply and validate migrations `202608230101`–`202608230107`.
2. Regenerate `apps/marketing-os/src/types/database.types.ts` from the linked Supabase project and replace the generated-style bootstrap type file.
3. Finish authentication/session middleware for the Next.js sub-app.
4. Finish Repository/Service unit tests.
5. Finish these production routes:
   - `/:workspaceSlug/home`
   - `/:workspaceSlug/campaigns/new`
   - `/:workspaceSlug/content/:contentId`
6. Add server actions/API boundaries for:
   - create content item,
   - text generation request,
   - image generation request,
   - compliance check,
   - request/decide approval,
   - UTM/tracking link creation.
7. Keep AI/provider callbacks server-only.
8. Add RLS tests before wiring production UI mutations.

## Do not implement yet

- Text-to-Video.
- Image-to-Video.
- Voice/Subtitles.
- Scheduler/auto publishing.
- Experiment winner selection.
- Attribution model.
- Lead scoring.
- Budget optimization.
- Autonomous publishing.

Those belong to Phases 2–4.

## Phase 1 acceptance tests

- Workspace A cannot read or write Workspace B marketing records.
- Viewer cannot mutate.
- Editor can create/edit strategy/campaign/content but cannot approve.
- Reviewer can approve/reject but cannot edit campaign/content copy.
- Browser cannot update `marketing_ai_jobs.status/output`.
- Browser cannot fabricate compliance findings.
- Blocking compliance finding prevents readiness.
- No approved content is considered ready until it also has a tracking link.
- Storage object path begins with the authenticated user's allowed workspace UUID.
- Campaign wizard never starts from an unstructured blank prompt.
- General audience messages do not lead with ISO/Audit.
- No unsupported claim, fake testimonial, fake scarcity or fake urgency is produced.

## Phase 1 product journey

`Brand Strategy → Audience/Persona → Campaign/Hypothesis → Content Text → Image → Compliance → Human Approval → UTM/Tracking → Ready for manual distribution`

When every acceptance test passes, tag the Phase 1 milestone and only then begin Phase 2 Creative Automation.
