export interface TaskDefinition {
  id: string;
  name: string;
  namespace: string;
  context?: string;
  assignerRoles?: string[];
  workerRoles?: string[];
}

export interface TaskState {
  queues: Record<string, TaskDefinition>;
}
