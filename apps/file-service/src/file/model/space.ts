import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { IsNotEmpty } from 'class-validator';
import * as validFilename from 'valid-filename';
import { AssertRole } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, Update, InvalidOperationError, New } from '@core-services/core-common';
import { FileSpace, FileType, ServiceUserRoles } from '../types';
import type { FileSpaceRepository } from '../repository';
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
  static async create(
    user: User,
    repository: FileSpaceRepository,
    space: Omit<FileSpace, 'types'>
  ): Promise<FileSpaceEntity> {
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

  getPath(storageRoot: string): string {
    return path.join(storageRoot, this.id);
  }

  async update(user: User, update: Update<FileSpace>): Promise<FileSpaceEntity> {
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

  async deleteType(user: User, typeId: string): Promise<void> {
    if (this.canUpdate(user)) {
      delete this.types[typeId];
      this.repository.save(this);
    } else {
      throw new UnauthorizedError('User not authorized to delete type.');
    }
  }

  updateType(user: User, typeId: string, update: Update<FileType>): Promise<FileSpaceEntity> {
    console.log(JSON.stringify(Object.values(this.types)) + '<>Object.values(this.types)');
    const type = Object.values(this.types).find((type) => type.id === typeId);
    type.update(user, update);

    return this.repository.save(this);
  }

  async addType(user: User, rootStoragePath: string, typeId: string, type: New<FileType>): Promise<FileSpaceEntity> {
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
      type.updateRoles,
      this.id
    );
    this.types[fileType.id] = fileType;

    const created = await this.repository.save(this);

    if (created) {
      const typeFolder = fileType.getPath(rootStoragePath);
      await mkdirp(typeFolder);
    }
    return created;
  }

  canAccess(user: User): boolean {
    return (
      user && user.roles && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.spaceAdminRole))
    );
  }

  canUpdate(user: User): boolean {
    return (
      user && user.roles && (user.roles.includes(ServiceUserRoles.Admin) || user.roles.includes(this.spaceAdminRole))
    );
  }

  delete(entity: FileSpaceEntity): Promise<boolean> {
    return this.repository.delete(entity);
  }
}
