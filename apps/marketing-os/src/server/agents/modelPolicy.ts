export type AgentModelTier = 'executive' | 'professional' | 'balanced' | 'economy';
export type ReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export const AGENT_MODELS: Record<AgentModelTier, string> = {
  executive: process.env.OPENAI_EXECUTIVE_MODEL ?? 'gpt-6-astra',
  professional: process.env.OPENAI_PRO_MODEL ?? 'gpt-5.6-sol',
  balanced: process.env.OPENAI_BALANCED_MODEL ?? 'gpt-5.6-terra',
  economy: process.env.OPENAI_ECONOMY_MODEL ?? 'gpt-5.6-luna',
};

export const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL ?? 'gpt-5.6-sol';

export function reasoningForObjective(objective: string): ReasoningEffort {
  const normalized = objective.toLowerCase();

  if (/production|incident|security|release|deploy|migration|critical/.test(normalized)) {
    return 'xhigh';
  }

  if (/strategy|architecture|pricing|business model|go-to-market|governance/.test(normalized)) {
    return 'high';
  }

  if (/analy|research|evaluate|compare|diagnos/.test(normalized)) {
    return 'medium';
  }

  return 'low';
}
