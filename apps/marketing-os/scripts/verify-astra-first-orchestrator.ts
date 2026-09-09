import assert from 'node:assert/strict';

import {
  ASTRA_MODEL,
  SOL_FALLBACK_MODEL,
  getModelRoute,
} from '../src/server/ai/modelRouter';
import { ContentGrowthRequestSchema } from '../src/server/ai/contentGrowthOrchestrator';
import { CEO_AI_BUSINESS_DNA } from '../src/server/ai/ceoAiBusinessDna';

assert.equal(ASTRA_MODEL, 'gpt-6-astra');
assert.equal(SOL_FALLBACK_MODEL, 'gpt-5.6-sol');

const route = getModelRoute();
assert.ok(route.primary.length > 0, 'primary model must be configured');
assert.ok(route.fallback.length > 0, 'fallback model must be configured');
assert.ok(
  ['low', 'medium', 'high', 'xhigh', 'max'].includes(route.reasoningEffort),
  'Astra reasoning effort must never be none/minimal',
);

assert.match(CEO_AI_BUSINESS_DNA, /Problem First -> AI Second/);
assert.match(CEO_AI_BUSINESS_DNA, /Think -> Build -> Measure -> Learn -> Grow/);
assert.match(CEO_AI_BUSINESS_DNA, /Hypothesis -> Content -> Distribution/);

const request = ContentGrowthRequestSchema.parse({
  context: {
    workspaceId: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    role: 'owner',
    phase: 'phase1',
    evidenceMaturity: 'hypothesis',
    measurementHealth: 'unknown',
    consentState: 'necessary',
    traceId: 'trace-astra-contract-001',
  },
  topic: 'ทดสอบ Business Growth Content Engine',
  platform: 'CEO AI Thailand',
});

assert.equal(request.reasoningEffort, 'medium');
assert.deepEqual(request.constraints, []);

console.log('Astra-first orchestration contract: PASS');
