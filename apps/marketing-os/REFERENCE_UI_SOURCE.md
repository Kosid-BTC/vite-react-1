# Marketing OS Reference UI Source of Truth

This branch implements the user-approved CEO AI Thailand UX/UI directly from the three reference screenshots supplied in the product conversation.

Release rules for this branch:

- The screenshots are the visual and information-hierarchy source of truth.
- Figma is not an implementation dependency or authority for this revision.
- Kanit remains the primary UI font.
- Desktop uses the dense light SaaS layout with purple/violet primary accent shown in the references.
- Responsive/mobile behavior must preserve the same priority order rather than shrink the desktop canvas.
- Production metrics without verified evidence must render truthful UNAVAILABLE/UNVERIFIED states; do not fabricate values.
- Do not merge or deploy to production until build/typecheck/regression gates and visual QA are complete.
