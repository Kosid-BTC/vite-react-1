import {
  MarketingAgentContextSchema,
  OrchestratorDecisionSchema,
  type MarketingAgentRuntime,
  type OrchestratorDecision,
} from './contracts';
import { AGENT_MODELS, reasoningForObjective } from './modelPolicy';
import { runModel } from './openaiResponsesGateway';

const CEO_INSTRUCTIONS = `You are CEO AI Thailand's executive orchestrator.
Your job is to understand the business objective, select specialist agents, assess evidence quality, and return a decision.
Never fabricate metrics, attribution, customer evidence, approvals, or system state.
External publishing, budget mutation, destructive actions, production deployment, and irreversible changes require explicit human approval.
When evidence is missing or measurement health is weak, fail closed.
Return JSON only, matching this shape:
{
  "status": "completed" | "needs_more_evidence" | "needs_human_approval" | "blocked_by_phase" | "blocked_by_policy",
  "specialistsUsed": string[],
  "result": {
    "summary": string,
    "confidence": number,
    "evidence": [{"type":"first_party"|"research"|"system"|"user_input","reference":string,"maturity":"hypothesis"|"research"|"observed"|"validated"}],
    "assumptions": string[],
    "blockers": string[],
    "nextAction": string | null,
    "approvalRequired": boolean
  }
}`;

function failClosed(message: string): OrchestratorDecision {
  return {
    status: 'blocked_by_policy',
    specialistsUsed: [],
    result: {
      summary: 'The CEO orchestrator could not produce a verified structured decision.',
      confidence: 0,
      evidence: [],
      assumptions: [],
      blockers: [message],
      nextAction: 'Review the model response and runtime evidence before any action is executed.',
      approvalRequired: true,
    },
  };
}

export class AstraCeoOrchestrator implements MarketingAgentRuntime {
  async run(input: {
    context: unknown;
    objective: string;
  }): Promise<OrchestratorDecision> {
    const context = MarketingAgentContextSchema.parse(input.context);
    const reasoning = reasoningForObjective(input.objective);

    const prompt = `${CEO_INSTRUCTIONS}\n\nOBJECTIVE:\n${input.objective}\n\nCONTEXT:\n${JSON.stringify(context)}`;

    try {
      const response = await runModel({
        model: AGENT_MODELS.executive,
        prompt,
        reasoning,
        metadata: {
          product: 'ceo-ai-thailand',
          runtime: 'agent-to-agent-production-os',
          trace_id: context.traceId.slice(0, 64),
          workspace_id: context.workspaceId,
        },
      });

      if (!response.text) {
        return failClosed(`Model ${response.modelUsed} returned no output text.`);
      }

      const parsed = JSON.parse(response.text) as unknown;
      return OrchestratorDecisionSchema.parse(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Astra orchestrator error';
      return failClosed(message);
    }
  }
}
