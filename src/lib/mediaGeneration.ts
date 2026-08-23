export type MarketingGenerationType =
  | 'text'
  | 'text_to_image'
  | 'text_to_video'
  | 'image_to_video'
  | 'text_to_audio';

export type MarketingJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type MarketingAssetKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'thumbnail'
  | 'carousel'
  | 'document'
  | 'subtitle'
  | 'final_export';

export type AspectRatio = '9:16' | '1:1' | '16:9';

export interface MediaProviderCapabilities {
  textToImage: boolean;
  textToVideo: boolean;
  imageToVideo: boolean;
  supportedAspectRatios: AspectRatio[];
  supportedDurations?: number[];
  supportedResolutions?: string[];
  maxInputImages?: number;
}

export interface TextToImageInput {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution?: string;
  styleHint?: string;
  negativePrompt?: string;
}

export interface TextToVideoInput {
  prompt: string;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  resolution?: string;
  motionPrompt?: string;
  negativePrompt?: string;
}

export interface ImageToVideoInput extends TextToVideoInput {
  sourceAssetId: string;
  sourceImageUrl?: string;
}

export interface MediaGenerationResult {
  providerJobId?: string;
  status: MarketingJobStatus;
  mimeType?: string;
  outputUrl?: string;
  base64?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  costUsd?: number;
  metadata?: Record<string, unknown>;
}

export interface TextToImageProvider {
  readonly id: string;
  capabilities(): MediaProviderCapabilities;
  generate(input: TextToImageInput): Promise<MediaGenerationResult>;
}

export interface TextToVideoProvider {
  readonly id: string;
  capabilities(): MediaProviderCapabilities;
  generate(input: TextToVideoInput): Promise<MediaGenerationResult>;
  getStatus(providerJobId: string): Promise<MediaGenerationResult>;
}

export interface ImageToVideoProvider {
  readonly id: string;
  capabilities(): MediaProviderCapabilities;
  generate(input: ImageToVideoInput): Promise<MediaGenerationResult>;
  getStatus(providerJobId: string): Promise<MediaGenerationResult>;
}

export type MediaProvider = TextToImageProvider | TextToVideoProvider | ImageToVideoProvider;

export class MediaProviderRegistry {
  private readonly providers = new Map<string, MediaProvider>();

  register(provider: MediaProvider): this {
    if (!provider.id.trim()) throw new Error('provider_id_required');
    this.providers.set(provider.id, provider);
    return this;
  }

  get(providerId: string): MediaProvider {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`media_provider_not_found:${providerId}`);
    return provider;
  }

  list(): MediaProvider[] {
    return [...this.providers.values()];
  }

  supporting(type: Extract<MarketingGenerationType, 'text_to_image' | 'text_to_video' | 'image_to_video'>): MediaProvider[] {
    return this.list().filter(provider => {
      const caps = provider.capabilities();
      if (type === 'text_to_image') return caps.textToImage;
      if (type === 'text_to_video') return caps.textToVideo;
      return caps.imageToVideo;
    });
  }
}

export function assertGenerationRequest(input: {
  generationType: MarketingGenerationType;
  prompt?: string;
  sourceAssetId?: string;
  aspectRatio?: string;
  durationSeconds?: number;
}): void {
  if (input.generationType !== 'text' && !input.prompt?.trim()) {
    throw new Error('prompt_required');
  }
  if (input.generationType === 'image_to_video' && !input.sourceAssetId) {
    throw new Error('source_asset_required');
  }
  if (input.aspectRatio && !['9:16', '1:1', '16:9'].includes(input.aspectRatio)) {
    throw new Error('unsupported_aspect_ratio');
  }
  if (input.durationSeconds !== undefined && (input.durationSeconds <= 0 || input.durationSeconds > 120)) {
    throw new Error('invalid_duration');
  }
}
