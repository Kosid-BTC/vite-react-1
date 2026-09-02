import assert from "node:assert/strict";
import {
  createDraftMediaJob,
  createGeneratedDraftAsset,
  createResumeToken,
  updateMediaJobProgress,
  type MediaGenerationProvider,
  type MediaGenerationRequest,
} from "../src/server/domain/media-generation";

async function main() {
  const request: MediaGenerationRequest = {
    kind: "TEXT_TO_VIDEO",
    prompt: "สร้างวิดีโออธิบาย Business Validation",
    promptVersion: "p2.0-v1",
    provider: "mock-a",
    model: "video-alpha",
    workspaceId: "workspace-a",
    campaignId: "campaign-a",
    contentItemId: "content-a",
  };

  const providerA: MediaGenerationProvider = {
    id: "mock-a",
    supports: () => true,
    async submit() {
      return { providerJobRef: "provider-job-a" };
    },
    async getProgress() {
      return { state: "RUNNING", progress: 50 };
    },
  };

  const providerB: MediaGenerationProvider = {
    id: "mock-b",
    supports: () => true,
    async submit() {
      return { providerJobRef: "provider-job-b" };
    },
    async getProgress() {
      return { state: "RUNNING", progress: 50 };
    },
  };

  assert.equal(providerA.supports(request.kind), true);
  assert.equal(providerB.supports(request.kind), true);
  const providerAResult = await providerA.submit(request);
  const providerBResult = await providerB.submit(request);
  assert.notEqual(providerAResult.providerJobRef, providerBResult.providerJobRef);

  const queued = createDraftMediaJob("job-1", request);
  assert.equal(queued.workspaceId, request.workspaceId);
  assert.equal(queued.campaignId, request.campaignId);
  assert.equal(queued.contentItemId, request.contentItemId);
  assert.equal(queued.approvalRequired, true);
  assert.equal(queued.publishable, false);

  assert.throws(() => updateMediaJobProgress(queued, { state: "RUNNING", progress: 101 }));
  assert.throws(() => updateMediaJobProgress(queued, { state: "RUNNING", progress: -1 }));

  const running = updateMediaJobProgress(queued, {
    state: "RUNNING",
    progress: 50,
    providerJobRef: "provider-job-a",
  });
  const expectedResume = createResumeToken(running);
  assert.equal(running.resumeToken, expectedResume);
  assert.equal(createResumeToken(running), expectedResume);

  const complete = updateMediaJobProgress(running, {
    state: "SUCCEEDED",
    progress: 100,
  });
  const asset = createGeneratedDraftAsset("asset-1", complete, "private://asset-1.mp4");
  assert.equal(asset.workspaceId, request.workspaceId);
  assert.equal(asset.campaignId, request.campaignId);
  assert.equal(asset.contentItemId, request.contentItemId);
  assert.equal(asset.approvalRequired, true);
  assert.equal(asset.publishable, false);

  const serialized = JSON.stringify({ request, queued, running, complete, asset });
  for (const forbidden of ["apiKey", "secret", "serviceRole", "authorization"]) {
    assert.equal(serialized.includes(forbidden), false, `browser-facing contract leaked ${forbidden}`);
  }

  console.log("P2_0_CREATIVE_AUTOMATION_FOUNDATION: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
