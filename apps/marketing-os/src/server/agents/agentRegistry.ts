import type { AgentName } from './contracts';

export type AgentRisk = 'low' | 'medium' | 'high' | 'critical';

export type AgentCapability =
  | 'research'
  | 'strategy'
  | 'content'
  | 'creative'
  | 'compliance'
  | 'tracking'
  | 'media'
  | 'video'
  | 'voice'
  | 'calendar'
  | 'measurement'
  | 'experimentation'
  | 'attribution'
  | 'sales'
  | 'next_best_action'
  | 'learning'
  | 'optimization'
  | 'publishing';

export interface AgentDefinition {
  name: AgentName;
  capabilities: readonly AgentCapability[];
  defaultRisk: AgentRisk;
  canMutateExternalState: boolean;
  humanApprovalRequiredFor: readonly string[];
}

export const AGENT_REGISTRY: Record<AgentName, AgentDefinition> = {
  marketing_orchestrator: { name: 'marketing_orchestrator', capabilities: ['strategy', 'research'], defaultRisk: 'medium', canMutateExternalState: false, humanApprovalRequiredFor: [] },
  customer_insight_agent: { name: 'customer_insight_agent', capabilities: ['research'], defaultRisk: 'low', canMutateExternalState: false, humanApprovalRequiredFor: [] },
  strategy_agent: { name: 'strategy_agent', capabilities: ['strategy'], defaultRisk: 'medium', canMutateExternalState: false, humanApprovalRequiredFor: [] },
  content_agent: { name: 'content_agent', capabilities: ['content'], defaultRisk: 'medium', canMutateExternalState: false, humanApprovalRequiredFor: ['external_publish'] },
  creative_brief_agent: { name: 'creative_brief_agent', capabilities: ['creative'], defaultRisk: 'low', canMutateExternalState: false, humanApprovalRequiredFor: [] },
  compliance_agent: { name: 'compliance_agent', capabilities: ['compliance'], defaultRisk: 'high', canMutateExternalState: false, humanApprovalRequiredFor: [] },
  tracking_agent: { name: 'tracking_agent', capabilities: ['tracking'], defaultRisk: 'high', canMutateExternalState: false, humanApprovalRequiredFor: ['tracking_config_mutation'] },
  media_director_agent: { name: 'media_director_agent', capabilities: ['media'], defaultRisk: 'high', canMutateExternalState: false, humanApprovalRequiredFor: ['ad_spend', 'campaign_publish'] },
  video_agent: { name: 'video_agent', capabilities: ['video'], defaultRisk: 'medium', canMutateExternalState: false, humanApprovalRequiredFor: ['external_publish'] },
  voice_subtitle_agent: { name: 'voice_subtitle_agent', capabilities: ['voice'], defaultRisk: 'medium', canMutateExternalState: false, humanApprovalRequiredFor: ['external_publish'] },
  calendar_agent: { name: 'calendar_agent', capabilities: ['calendar'], defaultRisk: 'medium', canMutateExternalState: false, humanApprovalRequiredFor: ['external_schedule'] },
  measurement_agent: { name: 'measurement_agent', capabilities: ['measurement'], defaultRisk: 'low', canMutateExternalState: false, humanApprovalRequiredFor: [] },
  experiment_agent: { name: 'experiment_agent', capabilities: ['experimentation'], defaultRisk: 'medium', canMutateExternalState: false, humanApprovalRequiredFor: ['experiment_launch'] },
  attribution_agent: { name: 'attribution_agent', capabilities: ['attribution'], defaultRisk: 'medium', canMutateExternalState: false, humanApprovalRequiredFor: [] },
  sales_intelligence_agent: { name: 'sales_intelligence_agent', capabilities: ['sales'], defaultRisk: 'medium', canMutateExternalState: false, humanApprovalRequiredFor: ['external_message'] },
  next_best_action_agent: { name: 'next_best_action_agent', capabilities: ['next_best_action'], defaultRisk: 'high', canMutateExternalState: false, humanApprovalRequiredFor: ['external_message', 'financial_commitment'] },
  learning_agent: { name: 'learning_agent', capabilities: ['learning'], defaultRisk: 'low', canMutateExternalState: false, humanApprovalRequiredFor: [] },
  optimization_agent: { name: 'optimization_agent', capabilities: ['optimization'], defaultRisk: 'high', canMutateExternalState: false, humanApprovalRequiredFor: ['ad_spend', 'campaign_mutation'] },
  publishing_agent: { name: 'publishing_agent', capabilities: ['publishing'], defaultRisk: 'critical', canMutateExternalState: true, humanApprovalRequiredFor: ['external_publish'] },
};

export function getAgentDefinition(name: AgentName): AgentDefinition {
  return AGENT_REGISTRY[name];
}
