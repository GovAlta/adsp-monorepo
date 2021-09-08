import { Task } from '../task';

export interface TaskRecord extends Omit<Task, 'tenantId' | 'definition' | 'queue' | 'assignment'> {
  tenant: string;
  queueNamespace: string;
  queueName: string;
  definitionNamespace: string;
  definitionName: string;
  assignedById: string;
  assignedByName: string;
  assignedTo: string;
  assignedOn: Date;
}
