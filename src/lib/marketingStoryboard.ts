import { supabase } from './supabase';

export type StoryboardSceneStatus = 'draft' | 'ready' | 'generating' | 'completed' | 'failed';

export interface StoryboardScene {
  id: string;
  workspace_id: string;
  content_item_id: string;
  scene_no: number;
  narration: string | null;
  visual_description: string | null;
  image_prompt: string | null;
  video_prompt: string | null;
  motion_prompt: string | null;
  duration_seconds: number | null;
  source_image_asset_id: string | null;
  video_asset_id: string | null;
  status: StoryboardSceneStatus;
  created_at: string;
  updated_at: string;
}

export interface StoryboardSceneDraft {
  id?: string;
  sceneNo: number;
  narration?: string;
  visualDescription?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  motionPrompt?: string;
  durationSeconds?: number;
  status?: StoryboardSceneStatus;
}

export function validateStoryboardDraft(draft: StoryboardSceneDraft): void {
  if (!Number.isInteger(draft.sceneNo) || draft.sceneNo <= 0) throw new Error('invalid_scene_no');
  if (draft.durationSeconds !== undefined && (!Number.isFinite(draft.durationSeconds) || draft.durationSeconds <= 0 || draft.durationSeconds > 120)) {
    throw new Error('invalid_scene_duration');
  }
  for (const value of [draft.narration, draft.visualDescription, draft.imagePrompt, draft.videoPrompt, draft.motionPrompt]) {
    if (value && value.length > 8000) throw new Error('scene_text_too_long');
  }
}

export function nextSceneNumber(scenes: Array<Pick<StoryboardScene, 'scene_no'>>): number {
  return scenes.length === 0 ? 1 : Math.max(...scenes.map(scene => scene.scene_no)) + 1;
}

export async function listStoryboardScenes(
  workspaceId: string,
  contentItemId: string,
): Promise<StoryboardScene[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('marketing_storyboard_scenes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('content_item_id', contentItemId)
    .order('scene_no', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(row => normalizeScene(row as Record<string, unknown>));
}

export async function upsertStoryboardScene(
  workspaceId: string,
  contentItemId: string,
  draft: StoryboardSceneDraft,
): Promise<StoryboardScene> {
  if (!supabase) throw new Error('supabase_not_available');
  validateStoryboardDraft(draft);

  const payload = {
    ...(draft.id ? { id: draft.id } : {}),
    workspace_id: workspaceId,
    content_item_id: contentItemId,
    scene_no: draft.sceneNo,
    narration: clean(draft.narration),
    visual_description: clean(draft.visualDescription),
    image_prompt: clean(draft.imagePrompt),
    video_prompt: clean(draft.videoPrompt),
    motion_prompt: clean(draft.motionPrompt),
    duration_seconds: draft.durationSeconds ?? null,
    status: draft.status ?? 'draft',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('marketing_storyboard_scenes')
    .upsert(payload, { onConflict: 'content_item_id,scene_no' })
    .select('*')
    .single();

  if (error) throw error;
  return normalizeScene(data as Record<string, unknown>);
}

export async function deleteStoryboardScene(
  workspaceId: string,
  sceneId: string,
): Promise<void> {
  if (!supabase) throw new Error('supabase_not_available');
  const { error } = await supabase
    .from('marketing_storyboard_scenes')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('id', sceneId);
  if (error) throw error;
}

export async function updateStoryboardAssetLinks(input: {
  workspaceId: string;
  sceneId: string;
  sourceImageAssetId?: string | null;
  videoAssetId?: string | null;
  status?: StoryboardSceneStatus;
}): Promise<StoryboardScene> {
  if (!supabase) throw new Error('supabase_not_available');
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.sourceImageAssetId !== undefined) patch.source_image_asset_id = input.sourceImageAssetId;
  if (input.videoAssetId !== undefined) patch.video_asset_id = input.videoAssetId;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from('marketing_storyboard_scenes')
    .update(patch)
    .eq('workspace_id', input.workspaceId)
    .eq('id', input.sceneId)
    .select('*')
    .single();

  if (error) throw error;
  return normalizeScene(data as Record<string, unknown>);
}

function clean(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeScene(row: Record<string, unknown>): StoryboardScene {
  return {
    id: String(row.id),
    workspace_id: String(row.workspace_id),
    content_item_id: String(row.content_item_id),
    scene_no: Number(row.scene_no),
    narration: row.narration ? String(row.narration) : null,
    visual_description: row.visual_description ? String(row.visual_description) : null,
    image_prompt: row.image_prompt ? String(row.image_prompt) : null,
    video_prompt: row.video_prompt ? String(row.video_prompt) : null,
    motion_prompt: row.motion_prompt ? String(row.motion_prompt) : null,
    duration_seconds: row.duration_seconds === null || row.duration_seconds === undefined ? null : Number(row.duration_seconds),
    source_image_asset_id: row.source_image_asset_id ? String(row.source_image_asset_id) : null,
    video_asset_id: row.video_asset_id ? String(row.video_asset_id) : null,
    status: String(row.status) as StoryboardSceneStatus,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}
