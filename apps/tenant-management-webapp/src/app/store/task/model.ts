import { ActionState } from '@store/session/models';
export interface TaskDefinition {
  id: string;
  name: string;
  namespace: string;
  context?: string;
  assignerRoles?: string[];
  workerRoles?: string[];
}
export interface QueueService {
  queues: Record<string, TaskDefinition>;
  indicator?: Indicator;
}
export const defaultTaskQueue: TaskDefinition = {
  id: '',
  name: '',
  namespace: '',
  context: '',
  assignerRoles: [],
  workerRoles: [],
};

export interface Indicator {
  details?: Record<string, ActionState>;
}

export interface TaskState {
  queues: Record<string, TaskDefinition>;
  tasks: Record<string, object>;
}

export interface DeleteTaskConfig {
  operation: string;
  configuration: { queues: Record<string, TaskDefinition> };
}
