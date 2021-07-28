import { AssertRole } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, Update } from '@core-services/core-common';
import type { PushSpaceRepository } from '../repository';
import type { PushSpace } from '../types';
import { ServiceUserRoles } from '../types';

export class PushSpaceEntity implements PushSpace {
  id: string;
  name: string;
  adminRole: string;

  @AssertRole('create push space', ServiceUserRoles.Admin)
  static create(user: User, repository: PushSpaceRepository, space: PushSpace): Promise<PushSpaceEntity> {
    const entity = new PushSpaceEntity(repository, space);
    return repository.save(entity);
  }

  constructor(private repository: PushSpaceRepository, space: PushSpace) {
    this.id = space.id;
    this.name = space.name;
    this.adminRole = space.adminRole;
  }

  update(user: User, update: Update<PushSpace>): Promise<PushSpaceEntity> {
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

  canAccess(user: User): boolean {
    return user && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.adminRole));
  }

  canUpdate(user: User): boolean {
    return user && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.adminRole));
  }
}
