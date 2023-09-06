export interface TaskDefinition {
  id: string;
  name: string;
  namespace: string;
  context: Record<string, unknown>;
  assignerRoles: string[];
  workerRoles: string[];
}

export const defaultTaskQueue: TaskDefinition = {
  id: '',
  name: '',
  namespace: '',
  context: {},
  assignerRoles: [],
  workerRoles: [],
};

export interface TaskState {
  queues: Record<string, TaskDefinition>;
}
