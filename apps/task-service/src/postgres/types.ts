import { Task, TaskPriority, TaskStatus } from '../task';

export interface TaskRecord extends Omit<Task, 'tenantId' | 'definition' | 'queue' | 'assignment'> {
  tenant: string;
  queueNamespace: string;
  queueName: string;
  definitionNamespace: string;
  definitionName: string;
  assignedById: string;
  assignedByName: string;
  assignedToId: string;
  assignedToName: string;
  assignedToEmail: string;
  assignedOn: Date;
}

export interface TaskAggregationResult {
  queueNamespace: string;
  queueName: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string;
  assignedToName: string;
  count: number | string;
}
