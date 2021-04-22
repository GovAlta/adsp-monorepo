import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { IsNotEmpty } from 'class-validator';
import * as validFilename from 'valid-filename';
import { User, UnauthorizedError, Update, InvalidOperationError, New, AssertRole } from '@core-services/core-common';
import { FileSpace, FileType, ServiceUserRoles } from '../types';
import { FileSpaceRepository } from '../repository';
import { FileTypeEntity } from './type';
export class FileSpaceEntity implements FileSpace {
  id: string;
  @IsNotEmpty()
  name: string;
  spaceAdminRole: string;
  repository: FileSpaceRepository;
  @IsNotEmpty()
  types: {
    [id: string]: FileTypeEntity;
  };

  @AssertRole('create file space', ServiceUserRoles.Admin)
  static async create(user: User, repository: FileSpaceRepository, space: Omit<FileSpace, 'types'>) {
    const entity = new FileSpaceEntity(repository, { types: {}, ...space });
    return repository.save(entity);
  }

  constructor(repository: FileSpaceRepository, space: FileSpace) {
    this.id = space.id;
    this.name = space.name;
    this.spaceAdminRole = space.spaceAdminRole;

    this.repository = repository;
    this.types = Object.entries(space.types).reduce((types, [id, type]) => {
      types[id] = new FileTypeEntity(type);
      return types;
    }, {});
  }

  getPath(storageRoot: string) {
    return path.join(storageRoot, this.id);
  }

  async update(user: User, update: Update<FileSpace>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to updated space.');
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.spaceAdminRole) {
      this.spaceAdminRole = update.spaceAdminRole;
    }

    return this.repository.save(this);
  }

  async deleteType(user: User, typeId: string) {
    if (this.canUpdate(user)) {
      delete this.types[typeId];
      this.repository.save(this);
    } else {
      throw new UnauthorizedError('User not authorized to delete type.');
    }
  }

  updateType(user: User, typeId: string, update: Update<FileType>) {
    const type = Object.values(this.types).find((type) => type.id === typeId);
    type.update(user, update);

    return this.repository.save(this);
  }

  async addType(user, rootStoragePath: string, typeId: string, type: New<FileType>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to create type.');
    }

    const existing = this.types[typeId];
    if (existing) {
      throw new InvalidOperationError(`Type with ID '${typeId}' already exists.`);
    }

    if (!validFilename(typeId)) {
      throw new InvalidOperationError(`Type ID '${typeId}' is not valid.`);
    }

    const fileType = await FileTypeEntity.create(
      typeId,
      type.name,
      type.anonymousRead,
      type.readRoles,
      type.updateRoles
    );
    this.types[fileType.id] = fileType;

    const created = await this.repository.save(this);

    if (created) {
      const typeFolder = fileType.getPath(rootStoragePath);
      mkdirp(typeFolder);
    }
    return created;
  }

  canAccess(user: User) {
    return (
      user && user.roles && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.spaceAdminRole))
    );
  }

  canUpdate(user: User) {
    return (
      user && user.roles && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.spaceAdminRole))
    );
  }

  delete(entity: FileSpaceEntity) {
    return this.repository.delete(entity);
  }
}
