import assert from "node:assert/strict";
import {
  createDeterministicSubtitleCues,
  createVoiceSubtitleDraft,
  validateSubtitleCues,
  type VoiceSubtitleRequest,
} from "../src/server/domain/voice-subtitles";

function main() {
  const request: VoiceSubtitleRequest = {
    workspaceId: "workspace-a",
    campaignId: "campaign-a",
    contentItemId: "content-a",
    assetId: "asset-a",
    script: "เริ่มจากปัญหาของลูกค้า\nจากนั้นพิสูจน์ด้วยข้อมูลจริง",
    language: "th-TH",
    voiceProvider: "mock-voice",
    subtitleProvider: "mock-subtitle",
  };

  const cuesA = createDeterministicSubtitleCues(request.script, 1800);
  const cuesB = createDeterministicSubtitleCues(request.script, 1800);
  assert.deepEqual(cuesA, cuesB);
  assert.equal(cuesA.length, 2);
  assert.equal(cuesA[0]?.startMs, 0);
  assert.equal(cuesA[0]?.endMs, 1800);
  assert.equal(cuesA[1]?.startMs, 1800);
  assert.equal(cuesA[1]?.endMs, 3600);

  assert.throws(() => validateSubtitleCues([{ index: 1, startMs: -1, endMs: 1000, text: "bad" }]));
  assert.throws(() => validateSubtitleCues([{ index: 1, startMs: 0, endMs: 1000, text: "   " }]));
  assert.throws(() => validateSubtitleCues([
    { index: 1, startMs: 0, endMs: 1500, text: "a" },
    { index: 2, startMs: 1400, endMs: 2000, text: "b" },
  ]));

  const draft = createVoiceSubtitleDraft("voice-subtitle-1", request, cuesA);
  assert.equal(draft.workspaceId, request.workspaceId);
  assert.equal(draft.campaignId, request.campaignId);
  assert.equal(draft.contentItemId, request.contentItemId);
  assert.equal(draft.assetId, request.assetId);
  assert.equal(draft.approvalRequired, true);
  assert.equal(draft.publishable, false);

  const serialized = JSON.stringify({ request, draft });
  for (const forbidden of ["apiKey", "secret", "serviceRole", "authorization"]) {
    assert.equal(serialized.includes(forbidden), false, `browser-facing contract leaked ${forbidden}`);
  }

  console.log("P2_1_VOICE_SUBTITLES_FOUNDATION: PASS");
  console.log("AUTONOMOUS_PUBLISH: NO");
  console.log("PRODUCTION_TOUCHED: NO");
}

main();
