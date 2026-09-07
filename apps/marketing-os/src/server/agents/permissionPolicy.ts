import type { AgentName, WorkspaceRole } from './contracts';
import { getAgentDefinition } from './agentRegistry';

export type AgentAction =
  | 'read_internal_data'
  | 'write_internal_draft'
  | 'external_message'
  | 'external_publish'
  | 'external_schedule'
  | 'tracking_config_mutation'
  | 'experiment_launch'
  | 'campaign_publish'
  | 'campaign_mutation'
  | 'ad_spend'
  | 'financial_commitment'
  | 'database_admin'
  | 'production_deploy';

export interface PermissionDecision {
  allowed: boolean;
  approvalRequired: boolean;
  reason: string;
}

const OWNER_ONLY_ACTIONS = new Set<AgentAction>([
  'ad_spend',
  'financial_commitment',
  'database_admin',
  'production_deploy',
]);

const ALWAYS_APPROVAL_ACTIONS = new Set<AgentAction>([
  'external_message',
  'external_publish',
  'external_schedule',
  'tracking_config_mutation',
  'experiment_launch',
  'campaign_publish',
  'campaign_mutation',
  'ad_spend',
  'financial_commitment',
  'database_admin',
  'production_deploy',
]);

export function evaluateAgentAction(input: {
  agent: AgentName;
  role: WorkspaceRole;
  action: AgentAction;
  humanApproved?: boolean;
}): PermissionDecision {
  const definition = getAgentDefinition(input.agent);

  if (OWNER_ONLY_ACTIONS.has(input.action) && input.role !== 'owner') {
    return { allowed: false, approvalRequired: true, reason: 'OWNER_ROLE_REQUIRED' };
  }

  if (input.action === 'production_deploy' || input.action === 'database_admin') {
    return {
      allowed: Boolean(input.humanApproved) && input.role === 'owner',
      approvalRequired: true,
      reason: input.humanApproved ? 'OWNER_APPROVAL_VERIFIED' : 'HUMAN_APPROVAL_REQUIRED',
    };
  }

  const agentRequiresApproval = definition.humanApprovalRequiredFor.includes(input.action);
  const approvalRequired = ALWAYS_APPROVAL_ACTIONS.has(input.action) || agentRequiresApproval;

  if (approvalRequired && !input.humanApproved) {
    return { allowed: false, approvalRequired: true, reason: 'HUMAN_APPROVAL_REQUIRED' };
  }

  if (input.action === 'read_internal_data' || input.action === 'write_internal_draft') {
    return { allowed: true, approvalRequired: false, reason: 'INTERNAL_NON_DESTRUCTIVE' };
  }

  if (!definition.canMutateExternalState && ALWAYS_APPROVAL_ACTIONS.has(input.action)) {
    return { allowed: true, approvalRequired: true, reason: 'APPROVED_BOUNDED_EXTERNAL_ACTION' };
  }

  return { allowed: true, approvalRequired, reason: 'POLICY_ALLOWED' };
}
