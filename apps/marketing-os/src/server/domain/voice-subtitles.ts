import type { MediaGenerationLineage } from "./media-generation";

export interface VoiceSubtitleLineage extends MediaGenerationLineage {
  assetId: string;
}

export interface VoiceSubtitleRequest extends VoiceSubtitleLineage {
  script: string;
  language: string;
  voiceProvider: string;
  subtitleProvider: string;
}

export interface SubtitleCue {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

export interface VoiceSubtitleDraft extends VoiceSubtitleLineage {
  id: string;
  language: string;
  voiceProvider: string;
  subtitleProvider: string;
  cues: SubtitleCue[];
  approvalRequired: true;
  publishable: false;
}

export interface VoiceGenerationProvider {
  readonly id: string;
  supports(language: string): boolean;
}

export interface SubtitleGenerationProvider {
  readonly id: string;
  supports(language: string): boolean;
}

export function validateSubtitleCues(cues: SubtitleCue[]): SubtitleCue[] {
  let previousEnd = 0;
  return cues.map((cue, position) => {
    if (!Number.isInteger(cue.startMs) || !Number.isInteger(cue.endMs) || cue.startMs < 0 || cue.endMs <= cue.startMs) {
      throw new Error("Subtitle cue timestamps must be non-negative integer milliseconds with endMs > startMs.");
    }
    if (!cue.text.trim()) {
      throw new Error("Subtitle cue text must not be empty.");
    }
    if (position > 0 && cue.startMs < previousEnd) {
      throw new Error("Subtitle cues must be ordered and non-overlapping.");
    }
    previousEnd = cue.endMs;
    return { ...cue, index: position + 1, text: cue.text.trim() };
  });
}

export function createDeterministicSubtitleCues(script: string, millisecondsPerSegment = 2000): SubtitleCue[] {
  if (!Number.isInteger(millisecondsPerSegment) || millisecondsPerSegment <= 0) {
    throw new Error("millisecondsPerSegment must be a positive integer.");
  }
  const segments = script
    .split(/(?<=[.!?\u0E2F])\s+|\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) {
    throw new Error("Script must contain subtitle text.");
  }
  return validateSubtitleCues(
    segments.map((text, index) => ({
      index: index + 1,
      startMs: index * millisecondsPerSegment,
      endMs: (index + 1) * millisecondsPerSegment,
      text,
    })),
  );
}

export function createVoiceSubtitleDraft(
  id: string,
  request: VoiceSubtitleRequest,
  cues: SubtitleCue[],
): VoiceSubtitleDraft {
  return {
    id,
    workspaceId: request.workspaceId,
    campaignId: request.campaignId,
    contentItemId: request.contentItemId,
    assetId: request.assetId,
    language: request.language,
    voiceProvider: request.voiceProvider,
    subtitleProvider: request.subtitleProvider,
    cues: validateSubtitleCues(cues),
    approvalRequired: true,
    publishable: false,
  };
}
