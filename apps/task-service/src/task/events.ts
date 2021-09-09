import { DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { Update } from '@core-services/core-common';
import { Task, TaskAssignment, TaskPriority } from './types';

const taskSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
  },
};

const userSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
};

const TASK_CREATED = 'task-created';
export const TaskCreatedDefinition: DomainEventDefinition = {
  name: TASK_CREATED,
  description: 'Signalled when a task is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      task: taskSchema,
      createdBy: userSchema,
    },
  },
};

const TASK_UPDATED = 'task-updated';
export const TaskUpdatedDefinition: DomainEventDefinition = {
  name: TASK_UPDATED,
  description: 'Signalled when a task is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      task: taskSchema,
      update: {
        type: 'object',
      },
      updatedBy: userSchema,
    },
  },
};

const TASK_PRIORITY_SET = 'task-priority-set';
export const TaskPrioritySetDefinition: DomainEventDefinition = {
  name: TASK_PRIORITY_SET,
  description: 'Signalled when priority is set for a task.',
  payloadSchema: {
    type: 'object',
    properties: {
      task: taskSchema,
      from: {
        type: 'string',
      },
      to: {
        type: 'string',
      },
      updatedBy: userSchema,
    },
  },
};

const TASK_ASSIGNED = 'task-assigned';
export const TaskAssignedDefinition: DomainEventDefinition = {
  name: TASK_ASSIGNED,
  description: 'Signalled when a task is assigned or unassigned.',
  payloadSchema: {
    type: 'object',
    properties: {
      task: taskSchema,
      from: {
        type: 'object',
        properties: {
          assignedOn: {
            type: 'string',
            format: 'date-time',
          },
          assignedTo: { ...userSchema, email: { type: 'string' } },
          assignedBy: userSchema,
        },
      },
      to: {
        type: 'object',
        properties: {
          assignedOn: {
            type: 'string',
            format: 'date-time',
          },
          assignedTo: { ...userSchema, email: { type: 'string' } },
          assignedBy: userSchema,
        },
      },
      assignedBy: userSchema,
    },
  },
};

const TASK_STARTED = 'task-started';
export const TaskStartedDefinition: DomainEventDefinition = {
  name: TASK_STARTED,
  description: 'Signalled when a task is started.',
  payloadSchema: {
    type: 'object',
    properties: {
      task: taskSchema,
      startedBy: userSchema,
    },
  },
  interval: {
    namespace: 'task-service',
    name: TASK_CREATED,
    metric: 'task-queue',
  },
};

const TASK_COMPLETED = 'task-completed';
export const TaskCompletedDefinition: DomainEventDefinition = {
  name: TASK_COMPLETED,
  description: 'Signalled when a task is completed.',
  payloadSchema: {
    type: 'object',
    properties: {
      task: taskSchema,
      completedBy: userSchema,
    },
  },
  interval: {
    namespace: 'task-service',
    name: TASK_STARTED,
    metric: 'task-completed',
  },
};

const TASK_CANCELLED = 'task-cancelled';
export const TaskCancelledDefinition: DomainEventDefinition = {
  name: TASK_CANCELLED,
  description: 'Signalled when a task is cancelled.',
  payloadSchema: {
    type: 'object',
    properties: {
      task: taskSchema,
      cancelledBy: userSchema,
    },
  },
};

function mapContext(task: Task): Record<string, string | number | boolean> {
  return {
    queueNamespace: task.queue.namespace,
    queueName: task.queue.name,
    definitionNamespace: task.definition?.namespace,
    definitionName: task.definition?.name,
    recordId: task.recordId,
  };
}

function mapTask(task: Task): Record<string, unknown> {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
  };
}

function mapUser({ id, name }: User): Record<string, unknown> {
  return {
    id,
    name,
  };
}

export const taskCreated = (user: User, task: Task): DomainEvent => ({
  tenantId: task.tenantId,
  name: TASK_CREATED,
  timestamp: task.createdOn,
  correlationId: task.id,
  context: mapContext(task),
  payload: {
    task: mapTask(task),
    createdBy: mapUser(user),
  },
});

export const taskUpdated = (user: User, task: Task, update: Update<Task>): DomainEvent => ({
  tenantId: task.tenantId,
  name: TASK_UPDATED,
  timestamp: new Date(),
  correlationId: task.id,
  context: mapContext(task),
  payload: {
    task: mapTask(task),
    update,
    updatedBy: mapUser(user),
  },
});

export const taskPrioritySet = (user: User, task: Task, from: TaskPriority): DomainEvent => ({
  tenantId: task.tenantId,
  name: TASK_PRIORITY_SET,
  timestamp: new Date(),
  correlationId: task.id,
  context: mapContext(task),
  payload: {
    task: mapTask(task),
    from: TaskPriority[from],
    to: TaskPriority[task.priority],
    updatedBy: mapUser(user),
  },
});

export const taskAssigned = (user: User, task: Task, from: TaskAssignment): DomainEvent => ({
  tenantId: task.tenantId,
  name: TASK_ASSIGNED,
  timestamp: task.assignment?.assignedOn || new Date(),
  correlationId: task.id,
  context: mapContext(task),
  payload: {
    task: mapTask(task),
    from,
    to: task.assignment,
    assignedBy: mapUser(user),
  },
});

export const taskStarted = (user: User, task: Task): DomainEvent => ({
  tenantId: task.tenantId,
  name: TASK_STARTED,
  timestamp: task.startedOn,
  correlationId: task.id,
  context: mapContext(task),
  payload: {
    task: mapTask(task),
    startedBy: mapUser(user),
  },
});

export const taskCompleted = (user: User, task: Task): DomainEvent => ({
  tenantId: task.tenantId,
  name: TASK_COMPLETED,
  timestamp: task.endedOn,
  correlationId: task.id,
  context: mapContext(task),
  payload: {
    task: mapTask(task),
    completedBy: mapUser(user),
  },
});

export const taskCancelled = (user: User, task: Task): DomainEvent => ({
  tenantId: task.tenantId,
  name: TASK_COMPLETED,
  timestamp: task.endedOn,
  correlationId: task.id,
  context: mapContext(task),
  payload: {
    task: mapTask(task),
    cancelledBy: mapUser(user),
  },
});
