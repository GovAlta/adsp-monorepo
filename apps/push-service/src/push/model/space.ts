import type { User } from '@core-services/core-common';
import { AssertRole, UnauthorizedError, Update } from '@core-services/core-common';
import type { PushSpaceRepository } from '../repository';
import type { PushSpace } from '../types'
import { ServiceUserRoles } from '../types';

export class PushSpaceEntity implements PushSpace {
  id: string;
  name: string;
  adminRole: string;

  @AssertRole('create push space', ServiceUserRoles.Admin)
  static create(user: User, repository: PushSpaceRepository, space: PushSpace) {
    const entity = new PushSpaceEntity(repository, space);
    return repository.save(entity);
  }

  constructor(private repository: PushSpaceRepository, space: PushSpace) {
    this.id = space.id;
    this.name = space.name;
    this.adminRole = space.adminRole;
  }

  update(user: User, update: Update<PushSpace>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to updated space.');
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.adminRole) {
      this.adminRole = update.adminRole;
    }

    return this.repository.save(this);
  }

  canAccess(user: User) {
    return user && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.adminRole));
  }

  canUpdate(user: User) {
    return user && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.adminRole));
  }
}
