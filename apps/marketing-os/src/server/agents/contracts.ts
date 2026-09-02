import { z } from 'zod';

export const MarketingPhaseSchema = z.enum(['phase1', 'phase2', 'phase3', 'phase4']);
export type MarketingPhase = z.infer<typeof MarketingPhaseSchema>;

export const EvidenceMaturitySchema = z.enum([
  'hypothesis',
  'research',
  'observed',
  'validated',
]);
export type EvidenceMaturity = z.infer<typeof EvidenceMaturitySchema>;

export const MeasurementHealthSchema = z.enum([
  'unknown',
  'unreliable',
  'caution',
  'reliable',
]);
export type MeasurementHealth = z.infer<typeof MeasurementHealthSchema>;

export const WorkspaceRoleSchema = z.enum([
  'owner',
  'admin',
  'editor',
  'reviewer',
  'viewer',
]);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

export const AgentNameSchema = z.enum([
  'marketing_orchestrator',
  'customer_insight_agent',
  'strategy_agent',
  'content_agent',
  'creative_brief_agent',
  'compliance_agent',
  'tracking_agent',
  'media_director_agent',
  'video_agent',
  'voice_subtitle_agent',
  'calendar_agent',
  'measurement_agent',
  'experiment_agent',
  'attribution_agent',
  'sales_intelligence_agent',
  'next_best_action_agent',
  'learning_agent',
  'optimization_agent',
  'publishing_agent',
]);
export type AgentName = z.infer<typeof AgentNameSchema>;

export const MarketingAgentContextSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  role: WorkspaceRoleSchema,
  phase: MarketingPhaseSchema,
  brandId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  contentItemId: z.string().uuid().optional(),
  experimentId: z.string().uuid().optional(),
  evidenceMaturity: EvidenceMaturitySchema.default('hypothesis'),
  measurementHealth: MeasurementHealthSchema.default('unknown'),
  consentState: z.enum(['unknown', 'necessary', 'analytics']).default('unknown'),
  traceId: z.string().min(8).max(200),
});
export type MarketingAgentContext = z.infer<typeof MarketingAgentContextSchema>;

export const AgentEvidenceSchema = z.object({
  type: z.enum(['first_party', 'research', 'system', 'user_input']),
  reference: z.string().min(1).max(500),
  maturity: EvidenceMaturitySchema,
});
export type AgentEvidence = z.infer<typeof AgentEvidenceSchema>;

export const SpecialistResultSchema = z.object({
  summary: z.string().min(1).max(8000),
  confidence: z.number().min(0).max(1),
  evidence: z.array(AgentEvidenceSchema).default([]),
  assumptions: z.array(z.string().max(1000)).default([]),
  blockers: z.array(z.string().max(1000)).default([]),
  nextAction: z.string().max(2000).nullable().default(null),
  approvalRequired: z.boolean().default(false),
});
export type SpecialistResult = z.infer<typeof SpecialistResultSchema>;

export const AgentTaskSchema = z.object({
  taskId: z.string().uuid(),
  agent: AgentNameSchema,
  objective: z.string().min(1).max(4000),
  input: z.record(z.string(), z.unknown()).default({}),
  requestedAt: z.string().datetime(),
});
export type AgentTask = z.infer<typeof AgentTaskSchema>;

export const OrchestratorDecisionSchema = z.object({
  status: z.enum([
    'completed',
    'needs_more_evidence',
    'needs_human_approval',
    'blocked_by_phase',
    'blocked_by_policy',
  ]),
  specialistsUsed: z.array(AgentNameSchema).default([]),
  result: SpecialistResultSchema,
});
export type OrchestratorDecision = z.infer<typeof OrchestratorDecisionSchema>;

export interface MarketingAgentRuntime {
  run(input: {
    context: MarketingAgentContext;
    objective: string;
  }): Promise<OrchestratorDecision>;
}
