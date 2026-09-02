import assert from "node:assert/strict";
import { attributeLastTouch } from "../src/server/domain/attribution";

function base() {
  return {
    workspaceId: "ws-1",
    campaignId: "campaign-1",
  };
}

function main() {
  const insufficient = attributeLastTouch({ ...base(), touchpoints: [], outcomes: [] });
  assert.equal(insufficient.decision, "INSUFFICIENT_ATTRIBUTION_EVIDENCE");
  assert.equal(insufficient.attributedTouchpointId, null);
  assert.equal(insufficient.causalClaim, false);
  assert.equal(insufficient.humanReviewRequired, true);
  assert.equal(insufficient.executable, false);

  const attributed = attributeLastTouch({
    ...base(),
    touchpoints: [
      {
        touchpointId: "tp-a",
        workspaceId: "ws-1",
        campaignId: "campaign-1",
        contentItemId: "content-a",
        evidenceRef: "evidence-touch-a",
        channel: "facebook",
        occurredAt: "2026-09-01T09:00:00+07:00",
      },
      {
        touchpointId: "tp-b",
        workspaceId: "ws-1",
        campaignId: "campaign-1",
        contentItemId: "content-b",
        evidenceRef: "evidence-touch-b",
        channel: "line",
        occurredAt: "2026-09-01T10:00:00+07:00",
      },
    ],
    outcomes: [
      {
        outcomeId: "outcome-1",
        workspaceId: "ws-1",
        campaignId: "campaign-1",
        evidenceRef: "evidence-outcome-1",
        occurredAt: "2026-09-01T11:00:00+07:00",
      },
    ],
  });
  assert.equal(attributed.decision, "ATTRIBUTED");
  assert.equal(attributed.attributedTouchpointId, "tp-b");
  assert.equal(attributed.attributedChannel, "line");
  assert.equal(attributed.attributedContentItemId, "content-b");
  assert.equal(attributed.model, "LAST_TOUCH");
  assert.deepEqual(attributed.sourceEvidenceRefs, [
    "evidence-outcome-1",
    "evidence-touch-a",
    "evidence-touch-b",
  ]);

  const deterministicTie = attributeLastTouch({
    ...base(),
    touchpoints: [
      {
        touchpointId: "tp-b",
        workspaceId: "ws-1",
        campaignId: "campaign-1",
        evidenceRef: "evidence-b",
        channel: "line",
        occurredAt: "2026-09-01T10:00:00Z",
      },
      {
        touchpointId: "tp-a",
        workspaceId: "ws-1",
        campaignId: "campaign-1",
        evidenceRef: "evidence-a",
        channel: "facebook",
        occurredAt: "2026-09-01T10:00:00Z",
      },
    ],
    outcomes: [
      {
        outcomeId: "outcome-1",
        workspaceId: "ws-1",
        campaignId: "campaign-1",
        evidenceRef: "evidence-outcome",
        occurredAt: "2026-09-01T10:01:00Z",
      },
    ],
  });
  assert.equal(deterministicTie.attributedTouchpointId, "tp-a");

  const noPriorTouchpoint = attributeLastTouch({
    ...base(),
    touchpoints: [
      {
        touchpointId: "tp-late",
        workspaceId: "ws-1",
        campaignId: "campaign-1",
        evidenceRef: "evidence-late",
        channel: "facebook",
        occurredAt: "2026-09-01T12:00:00Z",
      },
    ],
    outcomes: [
      {
        outcomeId: "outcome-early",
        workspaceId: "ws-1",
        campaignId: "campaign-1",
        evidenceRef: "evidence-early",
        occurredAt: "2026-09-01T11:00:00Z",
      },
    ],
  });
  assert.equal(noPriorTouchpoint.decision, "INSUFFICIENT_ATTRIBUTION_EVIDENCE");

  assert.throws(() => attributeLastTouch({
    ...base(),
    touchpoints: [{
      touchpointId: "tp-cross",
      workspaceId: "ws-2",
      campaignId: "campaign-1",
      evidenceRef: "evidence-cross",
      channel: "facebook",
      occurredAt: "2026-09-01T10:00:00Z",
    }],
    outcomes: [],
  }));

  assert.throws(() => attributeLastTouch({
    ...base(),
    touchpoints: [],
    outcomes: [{
      outcomeId: "outcome-bad-time",
      workspaceId: "ws-1",
      campaignId: "campaign-1",
      evidenceRef: "evidence-bad-time",
      occurredAt: "2026-09-01T11:00:00",
    }],
  }));

  console.log("P3_2_ATTRIBUTION_FOUNDATION: PASS");
}

main();
