import { AdspId, AssertRole, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, Update } from '@core-services/core-common';

import { TaskRepository } from '../repository';
import { TaskServiceRoles } from '../roles';
import { Task, TaskAssignment, TaskPriority, TaskStatus } from '../types';
import { QueueEntity } from './queue';

interface NewTask {
  tenantId: AdspId;
  context?: Record<string, string | number | boolean>;
  name: string;
  description?: string;
  definition?: { namespace: string; name: string };
  recordId?: string;
  data?: Record<string, unknown>;
  priority?: TaskPriority;
}

export class TaskEntity implements Task {
  tenantId: AdspId;
  id: string;
  context: Record<string, string | number | boolean>;
  queue: QueueEntity;
  definition?: { namespace: string; name: string };
  name: string;
  description: string;
  priority: TaskPriority;
  recordId: string;
  data: Record<string, unknown>;
  status: TaskStatus;
  createdOn: Date;
  startedOn: Date;
  endedOn: Date;
  assignment: TaskAssignment;

  @AssertRole('create task', [TaskServiceRoles.Admin, TaskServiceRoles.TaskWriter])
  static create(_user: User, repository: TaskRepository, queue: QueueEntity, task: NewTask): Promise<TaskEntity> {
    if (!task.name) {
      throw new InvalidOperationError('Task must have a name.');
    }

    const entity = new TaskEntity(repository, queue, task);
    return repository.save(entity);
  }

  constructor(private repository: TaskRepository, queue: QueueEntity, task: NewTask | Task) {
    this.tenantId = task.tenantId;
    this.context = task.context || {};
    this.queue = queue;
    this.definition = task.definition;
    this.name = task.name;
    this.description = task.description;
    this.recordId = task.recordId;
    this.data = task.data || {};

    const record = task as Task;
    if (record.id) {
      this.id = record.id;
      this.status = record.status;
      this.createdOn = record.createdOn;
      this.startedOn = record.startedOn;
      this.endedOn = record.endedOn;
      this.assignment = record.assignment;
      this.priority = record.priority;
    } else {
      this.status = TaskStatus.Pending;
      this.createdOn = new Date();
      this.priority = task.priority || TaskPriority.Normal;
    }
  }

  @AssertRole('update task', [TaskServiceRoles.Admin, TaskServiceRoles.TaskWriter])
  update(_user: User, update: Update<Task>): Promise<TaskEntity> {
    if (update.name) {
      this.name = update.name;
    }

    if (update.description) {
      this.description = update.description;
    }

    if (update.context) {
      this.context = update.context;
    }

    if (update.data) {
      this.data = update.data;
    }

    return this.repository.save(this);
  }

  setPriority(user: User, priority: TaskPriority): Promise<TaskEntity> {
    if (
      !user?.roles?.includes(TaskServiceRoles.Admin) &&
      !user?.roles?.includes(TaskServiceRoles.TaskWriter) &&
      !this.queue.canAssignTask(user)
    ) {
      throw new UnauthorizedUserError('set task priority', user);
    }

    switch (priority) {
      case TaskPriority.Urgent:
      case TaskPriority.High:
      case TaskPriority.Normal:
        this.priority = priority;
        break;
      default:
        throw new InvalidOperationError(`Specified priority '${priority}' not recognized.`);
    }

    return this.repository.save(this);
  }

  assign(user: User, assignTo: { id: string; name: string; email: string }): Promise<TaskEntity> {
    if (
      !(this.queue.canAssignTask(user) || (this.queue.canWorkOnTask(user) && (!assignTo || assignTo.id === user?.id)))
    ) {
      throw new UnauthorizedUserError('assign task', user);
    }

    if (this.endedOn && assignTo) {
      throw new InvalidOperationError('Cannot assign Completed or Cancelled task.');
    }

    this.assignment = assignTo
      ? {
          assignedOn: new Date(),
          assignedBy: {
            id: user.id,
            name: user.name,
          },
          assignedTo: assignTo,
        }
      : null;

    return this.repository.save(this);
  }

  canProgressTask(user: User): boolean {
    // Only the assigned worker can progress the task.
    return this.queue.canWorkOnTask(user) && (!this.assignment || user.id === this.assignment.assignedTo.id);
  }

  start(user: User): Promise<TaskEntity> {
    if (!this.canProgressTask(user)) {
      throw new UnauthorizedUserError('start task', user);
    }

    if (this.status !== TaskStatus.Pending) {
      throw new InvalidOperationError('Can only start tasks that are Pending.');
    }

    this.startedOn = new Date();
    this.status = TaskStatus.InProgress;
    return this.repository.save(this);
  }

  complete(user: User): Promise<TaskEntity> {
    if (!this.canProgressTask(user)) {
      throw new UnauthorizedUserError('complete task', user);
    }

    if (this.status !== TaskStatus.InProgress) {
      throw new InvalidOperationError('Can only complete tasks that are In Progress.');
    }

    this.endedOn = new Date();
    this.status = TaskStatus.Completed;
    return this.repository.save(this);
  }

  cancel(user: User): Promise<TaskEntity> {
    if (!this.canProgressTask(user) && !this.queue.canAccessTask(user)) {
      throw new UnauthorizedUserError('cancel task', user);
    }

    if (this.status !== TaskStatus.InProgress && this.status !== TaskStatus.Pending) {
      throw new InvalidOperationError('Can only cancel tasks that are Pending or In Progress.');
    }

    this.endedOn = new Date();
    this.status = TaskStatus.Cancelled;
    return this.repository.save(this);
  }
}
