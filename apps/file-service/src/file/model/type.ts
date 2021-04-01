import * as path from 'path';
import { IsNotEmpty, IsDefined } from 'class-validator';
import { User, New, UnauthorizedError, Update } from '@core-services/core-common';
import { FileType } from '../types';
import { FileSpaceEntity } from './space';

/**
 * Represents a type of file with specific access and update policy.
 *
 * Note that this entity is a child of the Space aggregate and hence not associated with
 * its own repository.
 * @export
 * @class FileTypeEntity
 * @implements {FileType}
 */
export class FileTypeEntity implements FileType {
  id: string;
  @IsNotEmpty()
  name: string;
  anonymousRead = false;
  @IsDefined()
  readRoles: string[] = [];
  @IsDefined()
  updateRoles: string[] = [];

  static create(user: User, space: FileSpaceEntity, id: string, type: New<FileType>) {
    if (!space.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to create type.');
    }

    return new FileTypeEntity(space, { id, ...type });
  }

  constructor(public space: FileSpaceEntity, type: FileType) {
    this.id = type.id;
    this.name = type.name;
    this.anonymousRead = type.anonymousRead;
    this.readRoles = type.readRoles || [];
    this.updateRoles = type.updateRoles || [];
  }

  getPath(storageRoot: string) {
    const spacePath = this.space.getPath(storageRoot);
    return path.join(spacePath, this.id);
  }

  canAccessFile(user: User) {
    return this.anonymousRead || (user && user.roles && !!user.roles.find((role) => this.readRoles.includes(role)));
  }

  canUpdateFile(user: User) {
    return user && user.roles && !!user.roles.find((role) => this.updateRoles.includes(role));
  }

  update(user: User, update: Update<FileType>) {
    if (!this.space.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update type.');
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.anonymousRead !== undefined) {
      this.anonymousRead = update.anonymousRead;
    }

    if (update.readRoles) {
      this.readRoles = update.readRoles;
    }

    if (update.updateRoles) {
      this.updateRoles = update.updateRoles;
    }
  }
}
