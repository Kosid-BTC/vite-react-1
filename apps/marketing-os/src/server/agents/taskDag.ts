import { z } from 'zod';
import { AgentNameSchema } from './contracts';

export const AgentDagTaskSchema = z.object({
  id: z.string().min(1).max(120),
  agent: AgentNameSchema,
  objective: z.string().min(1).max(4000),
  dependsOn: z.array(z.string().min(1).max(120)).default([]),
  approvalBoundary: z.enum(['none', 'human']).default('none'),
});

export const AgentDagSchema = z.object({
  goal: z.string().min(1).max(8000),
  tasks: z.array(AgentDagTaskSchema).min(1).max(64),
});

export type AgentDag = z.infer<typeof AgentDagSchema>;

export function validateAgentDag(input: unknown): AgentDag {
  const dag = AgentDagSchema.parse(input);
  const ids = new Set(dag.tasks.map((task) => task.id));

  if (ids.size !== dag.tasks.length) {
    throw new Error('AGENT_DAG_DUPLICATE_TASK_ID');
  }

  for (const task of dag.tasks) {
    for (const dependency of task.dependsOn) {
      if (!ids.has(dependency)) throw new Error(`AGENT_DAG_UNKNOWN_DEPENDENCY:${dependency}`);
      if (dependency === task.id) throw new Error(`AGENT_DAG_SELF_DEPENDENCY:${task.id}`);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(dag.tasks.map((task) => [task.id, task]));

  const visit = (id: string) => {
    if (visiting.has(id)) throw new Error(`AGENT_DAG_CYCLE:${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };

  for (const task of dag.tasks) visit(task.id);
  return dag;
}

export function readyTasks(dag: AgentDag, completedTaskIds: ReadonlySet<string>) {
  return dag.tasks.filter(
    (task) => !completedTaskIds.has(task.id) && task.dependsOn.every((id) => completedTaskIds.has(id)),
  );
}
