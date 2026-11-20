import { describe, expect, it } from 'vitest';
import { DEFAULT_DATA } from '../../data';
import { approvalRate, checkGuardrails, newContentItem, transition } from '../contentLibrary';
import { businessGenome } from '../businessGenome';

const item = (title: string, body: string) => newContentItem({ title, body, channel: 'social' });

describe('contentLibrary guardrails + flow', () => {
  it('flags legacy Starter prices but not other numbers', () => {
    expect(checkGuardrails({ title: 'โปร', body: 'Starter เพียง ฿390 ต่อเดือน' }).map(i => i.code)).toContain('legacy_price');
    expect(checkGuardrails({ title: 'โปร', body: 'เริ่มที่ 590 บาท' }).map(i => i.code)).toContain('legacy_price');
    expect(checkGuardrails({ title: 'โปร', body: 'Growth ฿1,490 และ Starter ฿790' })).toEqual([]);
    expect(checkGuardrails({ title: 'x', body: 'มี 3,900 ราย' })).toEqual([]);
  });
  it('flags overclaims and empty content', () => {
    expect(checkGuardrails({ title: 'a', body: 'รับประกันรายได้ 10 เท่า' }).map(i => i.code)).toContain('overclaim');
    expect(checkGuardrails({ title: '', body: '' }).map(i => i.code)).toContain('empty');
  });
  it('blocks approval when guardrails fail, allows when clean', () => {
    const review = { ...item('ok', 'Starter ฿390'), status: 'review' as const };
    expect(transition(review, 'approved').ok).toBe(false);
    const clean = { ...item('ok', 'Starter ฿790/เดือน'), status: 'review' as const };
    const r = transition(clean, 'approved');
    expect(r.ok && r.item.status).toBe('approved');
  });
  it('rejects illegal jumps (draft → published)', () => {
    expect(transition(item('a', 'b'), 'published').ok).toBe(false);
  });
  it('approvalRate is null with no items', () => {
    expect(approvalRate([])).toBeNull();
  });
});

describe('businessGenome (derived, never fabricated)', () => {
  it('demo seed data yields unavailable axes, not scores', () => {
    const g = businessGenome(structuredClone(DEFAULT_DATA));
    const byId = Object.fromEntries(g.axes.map(a => [a.id, a]));
    expect(byId.audience.score).toBeNull();
    expect(byId.content.score).toBeNull();
    expect(byId.audience.maturity).toBe('UNAVAILABLE');
    expect(g.overall).toBeNull();
  });
  it('content axis follows the approval rate', () => {
    const d = structuredClone(DEFAULT_DATA);
    const ok = { ...item('a', 'ข้อความปกติ'), status: 'approved' as const };
    d.contentLibrary = [ok, item('b', 'ข้อความ')];
    const c = businessGenome(d).axes.find(a => a.id === 'content')!;
    expect(c.score).toBe(50);
    expect(c.maturity).toBe('DERIVED');
  });
});
