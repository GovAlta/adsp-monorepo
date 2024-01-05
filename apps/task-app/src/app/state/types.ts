export const TASK_SERVICE_ID = 'urn:ads:platform:task-service';
export const PUSH_SERVICE_ID = 'urn:ads:platform:push-service';

export interface QueueDefinition {
  namespace: string;
  name: string;
  description: string;
  assignerRoles: string[];
  workerRoles: string[];
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Stopped' | 'Cancelled' | 'Completed';
export type TaskPriority = 'Normal' | 'High' | 'Urgent';
export interface Task {
  urn: string;
  id: string;
  recordId?: string;
  queue: { namespace: string; name: string };
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdOn: string;
  startedOn: string;
  endedOn: string;
  assignment: {
    assignedTo: {
      id: string;
      name: string;
    };
  };
}

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface SerializedAxiosError {
  status: number;
  message: string;
}

export type FeedbackMessageLevel = 'info' | 'success' | 'warn' | 'error';
export interface FeedbackMessage {
  id: string;
  level: FeedbackMessageLevel;
  message: string;
  in?: string;
}
