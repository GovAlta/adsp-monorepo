import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { TaskRepository } from '../repository';
import { TaskServiceRoles } from '../roles';
import { Queue } from '../types';
import { TaskEntity } from './task';

export class QueueEntity implements Queue {
  tenantId: AdspId;
  namespace: string;
  name: string;
  assignerRoles: string[] = [];
  workerRoles: string[] = [];
  context: Record<string, string | number | boolean>;

  constructor(queue: Queue) {
    this.tenantId = queue.tenantId;
    this.namespace = queue.namespace;
    this.name = queue.name;
    this.assignerRoles = queue.assignerRoles || [];
    this.workerRoles = queue.workerRoles || [];
    this.context = queue.context || {};
  }

  canAssignTask(user: User): boolean {
    return isAllowedUser(user, this.tenantId, [TaskServiceRoles.Admin, ...this.assignerRoles]);
  }

  canAccessTask(user: User): boolean {
    return isAllowedUser(
      user,
      this.tenantId,
      [TaskServiceRoles.Admin, TaskServiceRoles.TaskReader, ...this.workerRoles, ...this.assignerRoles],
      true
    );
  }

  canWorkOnTask(user: User): boolean {
    return isAllowedUser(user, this.tenantId, this.workerRoles);
  }

  async getTasks(user: User, repository: TaskRepository, top = 10, after: string): Promise<Results<TaskEntity>> {
    if (!this.canAccessTask(user)) {
      throw new UnauthorizedUserError('access queued tasks', user);
    }

    return await repository.getTasks({ [`${this.namespace}:${this.name}`]: this }, top, after, {
      queue: { namespace: this.namespace, name: this.name },
      notEnded: true,
    });
  }
}
