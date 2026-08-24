import type { AgentName, MarketingPhase } from './contracts';

const PHASE_ORDER: Record<MarketingPhase, number> = {
  phase1: 1,
  phase2: 2,
  phase3: 3,
  phase4: 4,
};

const AGENT_MIN_PHASE: Record<AgentName, MarketingPhase> = {
  marketing_orchestrator: 'phase1',
  customer_insight_agent: 'phase1',
  strategy_agent: 'phase1',
  content_agent: 'phase1',
  creative_brief_agent: 'phase1',
  compliance_agent: 'phase1',
  tracking_agent: 'phase1',
  media_director_agent: 'phase2',
  video_agent: 'phase2',
  voice_subtitle_agent: 'phase2',
  calendar_agent: 'phase2',
  measurement_agent: 'phase3',
  experiment_agent: 'phase3',
  attribution_agent: 'phase3',
  sales_intelligence_agent: 'phase3',
  next_best_action_agent: 'phase3',
  learning_agent: 'phase4',
  optimization_agent: 'phase4',
  publishing_agent: 'phase4',
};

export function isAgentEnabled(agent: AgentName, currentPhase: MarketingPhase): boolean {
  return PHASE_ORDER[currentPhase] >= PHASE_ORDER[AGENT_MIN_PHASE[agent]];
}

export function assertAgentEnabled(agent: AgentName, currentPhase: MarketingPhase): void {
  if (!isAgentEnabled(agent, currentPhase)) {
    throw new Error(`agent_not_enabled:${agent}:${currentPhase}`);
  }
}

export function enabledAgents(currentPhase: MarketingPhase): AgentName[] {
  return (Object.keys(AGENT_MIN_PHASE) as AgentName[]).filter(agent =>
    isAgentEnabled(agent, currentPhase),
  );
}
