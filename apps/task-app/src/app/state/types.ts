import { FormDefinition } from './form.slice';

export const TASK_SERVICE_ID = 'urn:ads:platform:task-service';
export const PUSH_SERVICE_ID = 'urn:ads:platform:push-service';
export const FORM_SERVICE_ID = 'urn:ads:platform:form-service';

export interface QueueDefinition {
  namespace: string;
  name: string;
  displayName?: string;
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
  definition: FormDefinition;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdOn: Date;
  startedOn?: Date;
  endedOn?: Date;
  assignment: {
    assignedTo: {
      id: string;
      name: string;
    };
  };
  data: Record<string, unknown>;
}
export interface FormDisposition {
  id: string;
  status: string;
  reason: string;
  date: Date;
}

export interface FormSubmission {
  urn: string;
  id: string;
  formId: string;
  formDefinitionId: string;
  formData: Record<string, string>;
  formFiles: Record<string, string>;
  created: Date;
  createdBy: {
    id: string;
    name: string;
  };
  disposition: FormDisposition;
  updated: Date;
  updatedBy: {
    id: string;
    name: string;
  };
  hash: string;
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
