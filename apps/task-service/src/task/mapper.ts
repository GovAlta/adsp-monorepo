import { AdspId } from '@abgov/adsp-service-sdk';
import { TaskEntity } from './model';
import { Task, TaskPriority } from './types';

export type TaskResponse = Omit<Task, 'tenantId' | 'priority'> & { urn: string; priority: string };
export function mapTask(apiId: AdspId, entity: TaskEntity): TaskResponse {
  return {
    urn: `${apiId}:/tasks/${entity.id}`,
    id: entity.id,
    name: entity.name,
    description: entity.description,
    context: entity.context,
    definition: entity.definition ? { namespace: entity.definition.namespace, name: entity.definition.name } : null,
    queue: entity.queue ? { namespace: entity.queue.namespace, name: entity.queue.name } : null,
    recordId: entity.recordId?.toString(),
    data: entity.data,
    status: entity.status,
    priority: TaskPriority[entity.priority],
    createdOn: entity.createdOn,
    startedOn: entity.startedOn,
    endedOn: entity.endedOn,
    assignment: entity.assignment,
  };
}
