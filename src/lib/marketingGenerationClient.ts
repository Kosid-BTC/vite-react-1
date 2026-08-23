import { supabase } from './supabase';
import {
  assertGenerationRequest,
  type AspectRatio,
  type MarketingGenerationType,
  type MarketingJobStatus,
} from './mediaGeneration';

export type MediaProviderId = 'openai_image' | 'google_veo' | 'runway';

export interface QueueMarketingGenerationInput {
  workspaceId: string;
  contentItemId?: string;
  generationType: Extract<MarketingGenerationType, 'text_to_image' | 'text_to_video' | 'image_to_video'>;
  provider?: MediaProviderId;
  model?: string;
  sourceAssetId?: string;
  prompt: string;
  motionPrompt?: string;
  negativePrompt?: string;
  aspectRatio?: AspectRatio;
  durationSeconds?: number;
  resolution?: string;
  idempotencyKey?: string;
  providerOptions?: Record<string, unknown>;
}

export interface MarketingGenerationJob {
  id: string;
  workspace_id: string;
  content_item_id: string | null;
  generation_type: MarketingGenerationType;
  provider: string;
  model: string | null;
  source_asset_id: string | null;
  prompt: string | null;
  motion_prompt: string | null;
  negative_prompt: string | null;
  aspect_ratio: string | null;
  duration_seconds: number | null;
  resolution: string | null;
  status: MarketingJobStatus;
  provider_job_id: string | null;
  output: Record<string, unknown> | null;
  error_code: string | null;
  error_message: string | null;
  estimated_cost_usd: number | null;
  actual_cost_usd: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface QueueMarketingGenerationResult {
  duplicate: boolean;
  job: MarketingGenerationJob;
}

export async function queueMarketingGeneration(
  input: QueueMarketingGenerationInput,
): Promise<QueueMarketingGenerationResult> {
  if (!supabase) throw new Error('supabase_not_available');

  assertGenerationRequest({
    generationType: input.generationType,
    prompt: input.prompt,
    sourceAssetId: input.sourceAssetId,
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
  });

  const { data, error } = await supabase.functions.invoke('marketing-generate', {
    body: {
      ...input,
      aspectRatio: input.aspectRatio ?? '9:16',
      durationSeconds: input.generationType === 'text_to_image'
        ? undefined
        : input.durationSeconds ?? 5,
    },
  });

  if (error) throw error;
  if (!data?.ok || !data?.job) throw new Error(data?.error ?? 'generation_queue_failed');

  return {
    duplicate: Boolean(data.duplicate),
    job: normalizeJob(data.job as Record<string, unknown>),
  };
}

export async function listMarketingGenerationJobs(
  workspaceId: string,
  limit = 30,
): Promise<MarketingGenerationJob[]> {
  if (!supabase) return [];

  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const { data, error } = await supabase
    .from('marketing_generation_jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return (data ?? []).map(row => normalizeJob(row as Record<string, unknown>));
}

function normalizeJob(row: Record<string, unknown>): MarketingGenerationJob {
  return {
    id: String(row.id),
    workspace_id: String(row.workspace_id),
    content_item_id: row.content_item_id ? String(row.content_item_id) : null,
    generation_type: String(row.generation_type) as MarketingGenerationType,
    provider: String(row.provider ?? ''),
    model: row.model ? String(row.model) : null,
    source_asset_id: row.source_asset_id ? String(row.source_asset_id) : null,
    prompt: row.prompt ? String(row.prompt) : null,
    motion_prompt: row.motion_prompt ? String(row.motion_prompt) : null,
    negative_prompt: row.negative_prompt ? String(row.negative_prompt) : null,
    aspect_ratio: row.aspect_ratio ? String(row.aspect_ratio) : null,
    duration_seconds: row.duration_seconds === null || row.duration_seconds === undefined
      ? null
      : Number(row.duration_seconds),
    resolution: row.resolution ? String(row.resolution) : null,
    status: String(row.status) as MarketingJobStatus,
    provider_job_id: row.provider_job_id ? String(row.provider_job_id) : null,
    output: row.output && typeof row.output === 'object' ? row.output as Record<string, unknown> : null,
    error_code: row.error_code ? String(row.error_code) : null,
    error_message: row.error_message ? String(row.error_message) : null,
    estimated_cost_usd: row.estimated_cost_usd === null || row.estimated_cost_usd === undefined
      ? null
      : Number(row.estimated_cost_usd),
    actual_cost_usd: row.actual_cost_usd === null || row.actual_cost_usd === undefined
      ? null
      : Number(row.actual_cost_usd),
    created_at: String(row.created_at),
    started_at: row.started_at ? String(row.started_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
  };
}
