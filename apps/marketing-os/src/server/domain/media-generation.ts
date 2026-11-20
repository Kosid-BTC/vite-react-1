export type MediaGenerationKind = "TEXT_TO_VIDEO" | "IMAGE_TO_VIDEO";

export type MediaJobState =
  | "QUEUED"
  | "RUNNING"
  | "PAUSED"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export interface MediaGenerationLineage {
  workspaceId: string;
  campaignId: string;
  contentItemId: string;
}

export interface MediaGenerationRequest extends MediaGenerationLineage {
  kind: MediaGenerationKind;
  prompt: string;
  promptVersion: string;
  sourceImageUrl?: string;
  provider: string;
  model: string;
}

export interface MediaGenerationJob extends MediaGenerationLineage {
  id: string;
  kind: MediaGenerationKind;
  provider: string;
  model: string;
  promptVersion: string;
  state: MediaJobState;
  progress: number;
  providerJobRef?: string;
  retryCount: number;
  resumeToken?: string;
  approvalRequired: true;
  publishable: false;
}

export interface GeneratedMediaAsset extends MediaGenerationLineage {
  id: string;
  jobId: string;
  uri: string;
  approvalRequired: true;
  publishable: false;
}

export interface MediaGenerationProvider {
  readonly id: string;
  supports(kind: MediaGenerationKind): boolean;
  submit(request: MediaGenerationRequest): Promise<{
    providerJobRef: string;
  }>;
  getProgress(providerJobRef: string): Promise<{
    state: MediaJobState;
    progress: number;
  }>;
}

export function assertProgress(progress: number): number {
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    throw new Error("Media job progress must be an integer between 0 and 100.");
  }
  return progress;
}

export function createResumeToken(job: Pick<MediaGenerationJob, "id" | "provider" | "providerJobRef" | "retryCount">): string {
  return [job.id, job.provider, job.providerJobRef ?? "pending", job.retryCount].join(":");
}

export function createDraftMediaJob(
  id: string,
  request: MediaGenerationRequest,
): MediaGenerationJob {
  return {
    id,
    kind: request.kind,
    provider: request.provider,
    model: request.model,
    promptVersion: request.promptVersion,
    workspaceId: request.workspaceId,
    campaignId: request.campaignId,
    contentItemId: request.contentItemId,
    state: "QUEUED",
    progress: 0,
    retryCount: 0,
    approvalRequired: true,
    publishable: false,
  };
}

export function updateMediaJobProgress(
  job: MediaGenerationJob,
  input: {
    state: MediaJobState;
    progress: number;
    providerJobRef?: string;
    retryCount?: number;
  },
): MediaGenerationJob {
  const next = {
    ...job,
    state: input.state,
    progress: assertProgress(input.progress),
    providerJobRef: input.providerJobRef ?? job.providerJobRef,
    retryCount: input.retryCount ?? job.retryCount,
  };

  return {
    ...next,
    resumeToken: createResumeToken(next),
  };
}

export function createGeneratedDraftAsset(
  id: string,
  job: MediaGenerationJob,
  uri: string,
): GeneratedMediaAsset {
  if (job.state !== "SUCCEEDED" || job.progress !== 100) {
    throw new Error("Media asset can only be created from a completed job.");
  }
  return {
    id,
    jobId: job.id,
    uri,
    workspaceId: job.workspaceId,
    campaignId: job.campaignId,
    contentItemId: job.contentItemId,
    approvalRequired: true,
    publishable: false,
  };
}
