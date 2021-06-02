import { AssertRole } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, Update } from '@core-services/core-common';
import type { NotificationSpaceRepository } from '../repository';
import type { NotificationSpace } from '../types';
import { ServiceUserRoles } from '../types';

export class NotificationSpaceEntity implements NotificationSpace {
  id: string;
  name: string;
  spaceAdminRole: string;
  subscriberAdminRole: string;

  @AssertRole('create notification space', ServiceUserRoles.Admin)
  static create(user: User, repository: NotificationSpaceRepository, space: NotificationSpace) {
    const entity = new NotificationSpaceEntity(repository, space);
    return repository.save(entity);
  }

  constructor(private repository: NotificationSpaceRepository, space: NotificationSpace) {
    this.id = space.id;
    this.name = space.name;
    this.spaceAdminRole = space.spaceAdminRole;
    this.subscriberAdminRole = space.subscriberAdminRole;
  }

  update(user: User, update: Update<NotificationSpace>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to updated space.');
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.spaceAdminRole) {
      this.spaceAdminRole = update.spaceAdminRole;
    }

    if (update.subscriberAdminRole) {
      this.subscriberAdminRole = update.subscriberAdminRole;
    }

    return this.repository.save(this);
  }

  canAccess(user: User) {
    return user && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.spaceAdminRole));
  }

  canUpdate(user: User) {
    return user && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.spaceAdminRole));
  }
}
