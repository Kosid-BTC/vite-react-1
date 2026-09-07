import 'server-only';

import { z } from 'zod';

import {
  MarketingAgentContextSchema,
  type MarketingAgentContext,
} from '../agents/contracts';
import { CEO_AI_BUSINESS_DNA } from './ceoAiBusinessDna';
import {
  runAstraFirst,
  type ModelRunTelemetry,
  type ReasoningEffort,
} from './modelRouter';

export const ContentObjectiveSchema = z.enum([
  'Awareness',
  'Engagement',
  'Lead',
  'Conversion',
  'Retention',
]);

export const StoryModelSchema = z.enum([
  'AIDA',
  'PAS',
  'Storytelling',
  'Hard Truth',
  'Before / After',
  'Myth / Reality',
  'Educational',
  'Case Study',
]);

export const WritingStyleSchema = z.enum([
  'Conversational',
  'Business Storytelling',
  'Educational Authority',
  'Empowerment',
  'Hard Truth',
  'Sales Psychology',
]);

export const ContentGrowthRequestSchema = z.object({
  context: MarketingAgentContextSchema,
  topic: z.string().min(1).max(8000),
  platform: z.string().min(1).max(200),
  objective: ContentObjectiveSchema.optional(),
  audience: z.string().max(2000).optional(),
  businessProblem: z.string().max(4000).optional(),
  productAction: z.string().max(2000).optional(),
  measurementGoal: z.string().max(2000).optional(),
  constraints: z.array(z.string().max(1000)).max(30).default([]),
  reasoningEffort: z.enum(['low', 'medium', 'high', 'xhigh', 'max']).default('medium'),
});

export type ContentGrowthRequest = z.infer<typeof ContentGrowthRequestSchema>;

export type ContentGrowthRun = {
  traceId: string;
  model: string;
  fallbackUsed: boolean;
  output: string;
  telemetry: ModelRunTelemetry[];
};

function buildInput(request: ContentGrowthRequest): string {
  const lines = [
    `Topic: ${request.topic}`,
    `Platform: ${request.platform}`,
    request.objective ? `Objective: ${request.objective}` : null,
    request.audience ? `Audience: ${request.audience}` : null,
    request.businessProblem ? `Business problem: ${request.businessProblem}` : null,
    request.productAction ? `Product action: ${request.productAction}` : null,
    request.measurementGoal ? `Measurement goal: ${request.measurementGoal}` : null,
    request.constraints.length > 0
      ? `Constraints:\n${request.constraints.map((item) => `- ${item}`).join('\n')}`
      : null,
    '',
    'Required reasoning sequence:',
    '1. Diagnose the business problem before selecting AI or a content tactic.',
    '2. State a testable hypothesis.',
    '3. Select the story model and writing style with a short reason.',
    '4. Produce the content and CTA.',
    '5. Connect the CTA to a concrete product action where appropriate.',
    '6. Define measurement and the next experiment.',
    '7. Flag claims that require external evidence; never invent sources or numbers.',
    '',
    'Return a concise, implementation-ready answer in Thai unless the request requires another language.',
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

export async function runContentGrowthOrchestrator(
  rawRequest: ContentGrowthRequest,
): Promise<ContentGrowthRun> {
  const request = ContentGrowthRequestSchema.parse(rawRequest);
  const context: MarketingAgentContext = request.context;
  const telemetry: ModelRunTelemetry[] = [];

  const result = await runAstraFirst({
    traceId: context.traceId,
    instructions: CEO_AI_BUSINESS_DNA,
    input: buildInput(request),
    reasoningEffort: request.reasoningEffort as ReasoningEffort,
    maxOutputTokens: 6000,
    metadata: {
      workspace_id: context.workspaceId,
      phase: context.phase,
      agent: 'marketing_orchestrator',
      evidence_maturity: context.evidenceMaturity,
      measurement_health: context.measurementHealth,
    },
    onTelemetry: (event) => {
      telemetry.push(event);
    },
  });

  return {
    traceId: context.traceId,
    model: result.model,
    fallbackUsed: result.fallbackUsed,
    output: result.outputText,
    telemetry,
  };
}
