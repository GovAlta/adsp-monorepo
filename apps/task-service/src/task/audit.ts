import {
  AuditAction,
  AuditCategories,
  AuditChangeSet,
  AuditRecordDetails,
  AuditService,
  AuditSeverities,
  toAuditActor,
  User,
} from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { Task, TaskAssignment, TaskPriority, TaskStatus } from './types';

const TASK_RESOURCE_TYPE = 'task';
const LOG_CONTEXT = 'task-audit';

export const TaskCreatedAuditAction: AuditAction = {
  name: 'task.created',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: TASK_RESOURCE_TYPE,
  description: 'A task is created in a queue.',
};

export const TaskAssignedAuditAction: AuditAction = {
  name: 'task.assigned',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: TASK_RESOURCE_TYPE,
  description: 'A task is assigned to another person, or unassigned.',
};

export const TaskSelfAssignedAuditAction: AuditAction = {
  name: 'task.self-assigned',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: TASK_RESOURCE_TYPE,
  description: 'A user assigns a task to themselves.',
};

export const TaskStartedAuditAction: AuditAction = {
  name: 'task.started',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: TASK_RESOURCE_TYPE,
  description: 'A task is started and set to In Progress.',
};

export const TaskCompletedAuditAction: AuditAction = {
  name: 'task.completed',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: TASK_RESOURCE_TYPE,
  description: 'A task is completed.',
};

export const TaskCancelledAuditAction: AuditAction = {
  name: 'task.cancelled',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: TASK_RESOURCE_TYPE,
  description: 'A task is cancelled.',
};

export const TaskPriorityChangedAuditAction: AuditAction = {
  name: 'task.priority-changed',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Info,
  resourceType: TASK_RESOURCE_TYPE,
  captureChangeSet: true,
  description: 'The priority of a task is changed.',
};

export const TaskDeletedAuditAction: AuditAction = {
  name: 'task.deleted',
  version: 1,
  category: AuditCategories.Administrative,
  severity: AuditSeverities.Warning,
  resourceType: TASK_RESOURCE_TYPE,
  description: 'A task is deleted.',
};

export const TaskAuditActions: AuditAction[] = [
  TaskCreatedAuditAction,
  TaskAssignedAuditAction,
  TaskSelfAssignedAuditAction,
  TaskStartedAuditAction,
  TaskCompletedAuditAction,
  TaskCancelledAuditAction,
  TaskPriorityChangedAuditAction,
  TaskDeletedAuditAction,
];

type AuditedTask = Pick<Task, 'tenantId' | 'id' | 'name' | 'recordId'> & {
  queue?: Pick<Task['queue'], 'namespace' | 'name'>;
};

/**
 * Audit details of a task. The record ID links the task to the domain record it is about, so it is recorded as the
 * correlation ID and in the metadata.
 */
export function toTaskAuditDetails(
  user: User,
  task: AuditedTask,
  metadata: Record<string, unknown> = {},
): AuditRecordDetails {
  const recordId = task.recordId?.toString() || undefined;
  return {
    tenantId: task.tenantId,
    actor: toAuditActor(user),
    resource: { type: TASK_RESOURCE_TYPE, id: task.id, name: task.name },
    correlationId: recordId,
    metadata: {
      queueNamespace: task.queue?.namespace ?? null,
      queueName: task.queue?.name ?? null,
      taskName: task.name,
      recordId: recordId ?? null,
      ...metadata,
    },
  };
}

const toAssignee = (assignment?: TaskAssignment) =>
  assignment?.assignedTo ? { id: assignment.assignedTo.id, name: assignment.assignedTo.name } : null;

/** Assigning a task to yourself is a self-assignment; anything else, including unassigning, is an assignment. */
export function toTaskAssignmentAuditAction(user: User, task: Pick<Task, 'assignment'>): AuditAction {
  const assignedTo = task.assignment?.assignedTo;
  return assignedTo && assignedTo.id === user?.id ? TaskSelfAssignedAuditAction : TaskAssignedAuditAction;
}

/** Audit details of an assignment, with the new and previous assignee. The assignee email is not recorded. */
export function toTaskAssignmentAuditDetails(
  user: User,
  task: AuditedTask & Pick<Task, 'assignment'>,
  previous?: TaskAssignment,
): AuditRecordDetails {
  return toTaskAuditDetails(user, task, {
    assignedTo: toAssignee(task.assignment),
    previousAssignedTo: toAssignee(previous),
  });
}

/** Audit details of a priority change, with the priority before and after the change as the change set. */
export function toTaskPriorityChangedAuditDetails(
  user: User,
  task: AuditedTask & Pick<Task, 'priority'>,
  previous: TaskPriority,
): AuditRecordDetails {
  const changeSet: AuditChangeSet = {
    before: { priority: TaskPriority[previous] ?? null },
    after: { priority: TaskPriority[task.priority] ?? null },
  };
  return { ...toTaskAuditDetails(user, task, { priority: TaskPriority[task.priority] }), changeSet };
}

/** Audit details of a cancellation. The reason is free text, so only whether one was provided is recorded. */
export function toTaskCancelledAuditDetails(
  user: User,
  task: AuditedTask,
  previousStatus: TaskStatus,
  reason?: string,
): AuditRecordDetails {
  return toTaskAuditDetails(user, task, { previousStatus, reasonProvided: !!reason });
}

/**
 * Records an audit event without blocking or failing the operation. The SDK logs events that are not recorded;
 * details are built inside the guard, so an error creating them is logged instead of failing a request that has
 * already been responded to.
 */
export function recordTaskAudit(
  auditService: AuditService,
  logger: Logger,
  action: AuditAction,
  getDetails: () => AuditRecordDetails,
): void {
  try {
    void auditService.record(action, getDetails());
  } catch (err) {
    logger.warn(`Failed to record audit event ${action.name}: ${err}`, { context: LOG_CONTEXT });
  }
}
