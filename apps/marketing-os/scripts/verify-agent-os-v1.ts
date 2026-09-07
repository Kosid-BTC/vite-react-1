import assert from 'node:assert/strict';
import { AGENT_REGISTRY } from '../src/server/agents/agentRegistry';
import { evaluateAgentAction } from '../src/server/agents/permissionPolicy';
import { readyTasks, validateAgentDag } from '../src/server/agents/taskDag';

assert.equal(Object.keys(AGENT_REGISTRY).length, 19, 'registry must cover all marketing agents');

const draftDecision = evaluateAgentAction({
  agent: 'content_agent',
  role: 'editor',
  action: 'write_internal_draft',
});
assert.equal(draftDecision.allowed, true);
assert.equal(draftDecision.approvalRequired, false);

const publishWithoutApproval = evaluateAgentAction({
  agent: 'publishing_agent',
  role: 'owner',
  action: 'external_publish',
});
assert.equal(publishWithoutApproval.allowed, false);
assert.equal(publishWithoutApproval.approvalRequired, true);

const deployByAdmin = evaluateAgentAction({
  agent: 'marketing_orchestrator',
  role: 'admin',
  action: 'production_deploy',
  humanApproved: true,
});
assert.equal(deployByAdmin.allowed, false);

const deployByApprovedOwner = evaluateAgentAction({
  agent: 'marketing_orchestrator',
  role: 'owner',
  action: 'production_deploy',
  humanApproved: true,
});
assert.equal(deployByApprovedOwner.allowed, true);
assert.equal(deployByApprovedOwner.approvalRequired, true);

const dag = validateAgentDag({
  goal: 'Build evidence-backed campaign recommendation',
  tasks: [
    { id: 'research', agent: 'customer_insight_agent', objective: 'Collect evidence', dependsOn: [] },
    { id: 'strategy', agent: 'strategy_agent', objective: 'Form strategy', dependsOn: ['research'] },
    { id: 'draft', agent: 'content_agent', objective: 'Draft content', dependsOn: ['strategy'], approvalBoundary: 'human' },
  ],
});

assert.deepEqual(readyTasks(dag, new Set()), [dag.tasks[0]]);
assert.deepEqual(readyTasks(dag, new Set(['research'])), [dag.tasks[1]]);

assert.throws(
  () => validateAgentDag({
    goal: 'cycle',
    tasks: [
      { id: 'a', agent: 'strategy_agent', objective: 'A', dependsOn: ['b'] },
      { id: 'b', agent: 'content_agent', objective: 'B', dependsOn: ['a'] },
    ],
  }),
  /AGENT_DAG_CYCLE/,
);

console.log('AGENT_OS_V1_GOVERNANCE: VERIFIED PASS');
