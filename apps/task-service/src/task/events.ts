import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { Update } from '@core-services/core-common';
import { TaskResponse, mapTask } from './mapper';
import { TaskEntity } from './model';
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
      type: ['string', 'null'],
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

const assignedUserSchema = {
  ...userSchema,
  type: ['object', 'null'],
  properties: {
    ...userSchema.properties,
    email: {
      type: ['string', 'null'],
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

const TASK_DATA_UPDATED = 'task-data-updated';
export const TaskDataUpdatedDefinition: DomainEventDefinition = {
  name: TASK_DATA_UPDATED,
  description: "Signalled when a task's data is updated.",
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
        enum: ['Normal', 'High', 'Urgent'],
      },
      to: {
        type: 'string',
        enum: ['Normal', 'High', 'Urgent'],
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
        type: ['object', 'null'],
        properties: {
          assignedOn: {
            type: 'string',
            format: 'date-time',
          },
          assignedTo: assignedUserSchema,
          assignedBy: userSchema,
        },
      },
      to: {
        type: ['object', 'null'],
        properties: {
          assignedOn: {
            type: 'string',
            format: 'date-time',
          },
          assignedTo: assignedUserSchema,
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
    metric: ['task-service', 'queueNamespace', 'queueName', 'queue'],
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
    metric: ['task-service', 'queueNamespace', 'queueName', 'completion'],
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
      reason: {
        type: ['string', 'null'],
      },
    },
  },
};

const TASK_DELETED = 'task-deleted';
export const TaskDeletedDefinition: DomainEventDefinition = {
  name: TASK_DELETED,
  description: '',
  payloadSchema: {
    type: 'object',
    properties: {
      task: taskSchema,
      deletedBy: userSchema,
    },
  },
};

function mapContext(task: Task): Record<string, string | number | boolean> {
  return {
    queueNamespace: task.queue.namespace,
    queueName: task.queue.name,
    definitionNamespace: task.definition?.namespace,
    definitionName: task.definition?.name,
    recordId: task.recordId?.toString(),
    assignedTo: task.assignment?.assignedTo?.id,
  };
}

function mapUser({ id, name }: User): Record<string, unknown> {
  return {
    id,
    name,
  };
}

function getCorrelationId(task: TaskResponse) {
  return task.recordId?.toString() || task.urn;
}

export const taskCreated = (apiId: AdspId, user: User, task: TaskEntity): DomainEvent => {
  const taskResponse = mapTask(apiId, task);
  return {
    tenantId: task.tenantId,
    name: TASK_CREATED,
    timestamp: task.createdOn,
    correlationId: getCorrelationId(taskResponse),
    context: mapContext(task),
    payload: {
      task: taskResponse,
      createdBy: mapUser(user),
    },
  };
};

export const taskUpdated = (apiId: AdspId, user: User, task: TaskEntity, update: Update<Task>): DomainEvent => {
  const taskResponse = mapTask(apiId, task);
  return {
    tenantId: task.tenantId,
    name: TASK_UPDATED,
    timestamp: new Date(),
    correlationId: getCorrelationId(taskResponse),
    context: mapContext(task),
    payload: {
      task: taskResponse,
      update,
      updatedBy: mapUser(user),
    },
  };
};

export const taskDataUpdated = (
  apiId: AdspId,
  user: User,
  task: TaskEntity,
  update: Record<string, unknown>
): DomainEvent => {
  const taskResponse = mapTask(apiId, task);
  return {
    tenantId: task.tenantId,
    name: TASK_DATA_UPDATED,
    timestamp: new Date(),
    correlationId: getCorrelationId(taskResponse),
    context: mapContext(task),
    payload: {
      task: taskResponse,
      update,
      updatedBy: mapUser(user),
    },
  };
};

export const taskPrioritySet = (apiId: AdspId, user: User, task: TaskEntity, from: TaskPriority): DomainEvent => {
  const taskResponse = mapTask(apiId, task);
  return {
    tenantId: task.tenantId,
    name: TASK_PRIORITY_SET,
    timestamp: new Date(),
    correlationId: getCorrelationId(taskResponse),
    context: mapContext(task),
    payload: {
      task: taskResponse,
      from: TaskPriority[from],
      to: TaskPriority[task.priority],
      updatedBy: mapUser(user),
    },
  };
};

export const taskAssigned = (apiId: AdspId, user: User, task: TaskEntity, from: TaskAssignment): DomainEvent => {
  const taskResponse = mapTask(apiId, task);
  return {
    tenantId: task.tenantId,
    name: TASK_ASSIGNED,
    timestamp: task.assignment?.assignedOn || new Date(),
    correlationId: getCorrelationId(taskResponse),
    context: mapContext(task),
    payload: {
      task: taskResponse,
      from,
      to: task.assignment,
      assignedBy: mapUser(user),
    },
  };
};

export const taskStarted = (apiId: AdspId, user: User, task: TaskEntity): DomainEvent => {
  const taskResponse = mapTask(apiId, task);
  return {
    tenantId: task.tenantId,
    name: TASK_STARTED,
    timestamp: task.startedOn,
    correlationId: getCorrelationId(taskResponse),
    context: mapContext(task),
    payload: {
      task: taskResponse,
      startedBy: mapUser(user),
    },
  };
};

export const taskCompleted = (apiId: AdspId, user: User, task: TaskEntity): DomainEvent => {
  const taskResponse = mapTask(apiId, task);
  return {
    tenantId: task.tenantId,
    name: TASK_COMPLETED,
    timestamp: task.endedOn,
    correlationId: getCorrelationId(taskResponse),
    context: mapContext(task),
    payload: {
      task: taskResponse,
      completedBy: mapUser(user),
    },
  };
};

export const taskCancelled = (apiId: AdspId, user: User, task: TaskEntity, reason?: string): DomainEvent => {
  const taskResponse = mapTask(apiId, task);
  return {
    tenantId: task.tenantId,
    name: TASK_CANCELLED,
    timestamp: task.endedOn,
    correlationId: getCorrelationId(taskResponse),
    context: mapContext(task),
    payload: {
      task: taskResponse,
      cancelledBy: mapUser(user),
      reason,
    },
  };
};

export const taskDeleted = (apiId: AdspId, user: User, task: TaskEntity): DomainEvent => {
  const taskResponse = mapTask(apiId, task);
  return {
    tenantId: task.tenantId,
    name: TASK_DELETED,
    timestamp: new Date(),
    correlationId: getCorrelationId(taskResponse),
    context: mapContext(task),
    payload: {
      task: taskResponse,
      deletedBy: mapUser(user),
    },
  };
};
