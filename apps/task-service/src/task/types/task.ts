import { AdspId } from '@abgov/adsp-service-sdk';

export enum TaskPriority {
  Normal = 1,
  High = 2,
  Urgent = 3,
}

export enum TaskStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Stopped = 'Stopped',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
}

export interface TaskAssignment {
  assignedOn: Date;
  assignedTo: string;
  assignedBy: {
    id: string;
    name: string;
  };
}

export interface Task {
  tenantId: AdspId;
  id: string;
  context: Record<string, string | number | boolean>;
  queue: {
    namespace: string;
    name: string;
  };
  definition?: {
    namespace: string;
    name: string;
  };
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  recordId?: string;
  createdOn: Date;
  startedOn: Date;
  endedOn: Date;
  assignment?: TaskAssignment;
}

export interface TaskCriteria {
  tenantId?: AdspId;
  id?: string;
  context?: Record<string, string | number | boolean>;
  queue?: {
    namespace: string;
    name: string;
  };
  definition?: {
    namespace: string;
    name: string;
  };
  notEnded?: boolean;
}
