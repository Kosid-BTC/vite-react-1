import { describe, expect, it } from 'vitest';
import { buildVideoPrompt, startVideo } from '../contentVideo';
import { newContentItem } from '../contentLibrary';

describe('contentVideo (gated off by default)', () => {
  const approved = { ...newContentItem({ title: 'หัวข้อ', body: 'Starter ฿790/เดือน', channel: 'social' }), status: 'approved' as const };

  it('does not call any provider while videoGenLive is false', async () => {
    const r = await startVideo(approved);
    expect(r.ok).toBe(false);
  });
  it('prompt forbids text, numbers and faces', () => {
    const p = buildVideoPrompt('a', 'b');
    expect(p).toContain('no text');
    expect(p).toContain('no recognizable faces');
  });
  it('truncates very long topics', () => {
    expect(buildVideoPrompt('x'.repeat(2000), 'y').length).toBeLessThan(900);
  });
});
