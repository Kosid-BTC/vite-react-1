import { describe, expect, it } from 'vitest';
import {
  MediaProviderRegistry,
  assertGenerationRequest,
  type MediaGenerationResult,
  type MediaProviderCapabilities,
  type TextToImageInput,
  type TextToImageProvider,
} from '../mediaGeneration';

class FakeImageProvider implements TextToImageProvider {
  readonly id = 'fake-image';

  capabilities(): MediaProviderCapabilities {
    return {
      textToImage: true,
      textToVideo: false,
      imageToVideo: false,
      supportedAspectRatios: ['9:16', '1:1'],
      supportedResolutions: ['1024x1024'],
      maxInputImages: 0,
    };
  }

  async generate(_input: TextToImageInput): Promise<MediaGenerationResult> {
    return { status: 'completed', mimeType: 'image/png' };
  }
}

describe('MediaProviderRegistry', () => {
  it('เลือก provider ตาม capability ไม่ผูก business logic กับ vendor', () => {
    const registry = new MediaProviderRegistry().register(new FakeImageProvider());
    expect(registry.supporting('text_to_image').map(p => p.id)).toEqual(['fake-image']);
    expect(registry.supporting('text_to_video')).toEqual([]);
  });

  it('ไม่ยอมให้ provider id ว่าง', () => {
    const provider = new FakeImageProvider();
    Object.defineProperty(provider, 'id', { value: ' ' });
    expect(() => new MediaProviderRegistry().register(provider)).toThrow('provider_id_required');
  });
});

describe('assertGenerationRequest', () => {
  it('บังคับ source asset สำหรับ image-to-video', () => {
    expect(() => assertGenerationRequest({
      generationType: 'image_to_video',
      prompt: 'natural camera motion',
      aspectRatio: '9:16',
      durationSeconds: 5,
    })).toThrow('source_asset_required');
  });

  it('ยอมรับ controlled image-to-video เมื่อข้อมูลหลักครบ', () => {
    expect(() => assertGenerationRequest({
      generationType: 'image_to_video',
      prompt: 'natural camera motion',
      sourceAssetId: 'asset-1',
      aspectRatio: '9:16',
      durationSeconds: 5,
    })).not.toThrow();
  });

  it('บล็อก aspect ratio และ duration ที่ไม่รองรับโดย contract กลาง', () => {
    expect(() => assertGenerationRequest({
      generationType: 'text_to_video',
      prompt: 'business owner planning after work',
      aspectRatio: '4:3',
    })).toThrow('unsupported_aspect_ratio');

    expect(() => assertGenerationRequest({
      generationType: 'text_to_video',
      prompt: 'business owner planning after work',
      durationSeconds: 121,
    })).toThrow('invalid_duration');
  });
});
