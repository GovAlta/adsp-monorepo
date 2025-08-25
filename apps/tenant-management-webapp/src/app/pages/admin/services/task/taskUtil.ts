import { TaskDefinition } from '@store/task/model';
export function getSortedQueues(queues: Record<string, TaskDefinition>): Record<string, TaskDefinition> {
  return Object.entries(queues ?? {})
    .sort(([, a], [, b]) => {
      const aKey = `${a.namespace}`;
      const bKey = `${b.namespace}`;
      return aKey.localeCompare(bKey);
    })
    .reduce((acc, [id, data]) => {
      acc[id] = data;
      return acc;
    }, {} as Record<string, TaskDefinition>);
}
