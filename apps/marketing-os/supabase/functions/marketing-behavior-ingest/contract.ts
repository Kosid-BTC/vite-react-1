import { z } from 'npm:zod@4.1.5';

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map((key) =>
      JSON.stringify(key) + ':' + canonical((value as Record<string, unknown>)[key])
    ).join(',') + '}';
  }
  return JSON.stringify(value);
}

export const schema = z.object({
  version: z.literal(1),
  batchId: z.string().uuid(),
  consent: z.literal('analytics_opt_in'),
  mode: z.enum(['live', 'test']),
  events: z.array(z.object({
    id: z.string().uuid(),
    session: z.string().uuid(),
    at: z.iso.datetime(),
    source: z.enum(['website', 'saas']),
    name: z.enum(['view', 'engaged', 'action']),
    topic: z.enum(['business_validation', 'first_customer', 'content_marketing', 'business_systems']),
    format: z.enum(['article', 'short_video', 'checklist', 'interactive']),
  }).strict()).min(1).max(20),
}).strict();

export function validate(input: unknown, now = Date.now()) {
  const batch = schema.parse(input);
  if (new Set(batch.events.map((event) => event.id)).size !== batch.events.length) {
    throw new Error('duplicate_event');
  }
  if (batch.events.some((event) => Date.parse(event.at) > now + 60000 || Date.parse(event.at) < now - 86400000)) {
    throw new Error('expired_event');
  }
  return batch;
}
