import * as path from 'path';
import { IsNotEmpty, IsDefined } from 'class-validator';
import { User, UnauthorizedError, Update } from '@core-services/core-common';
import { FileType, ServiceUserRoles } from '../types';
import { Logger } from 'winston';

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
  logger?: Logger;
  @IsNotEmpty()
  name: string;
  anonymousRead = false;
  @IsDefined()
  readRoles: string[] = [];
  @IsDefined()
  updateRoles: string[] = [];
  spaceId?: string;

  static create(id: string, name: string, anonymousRead: boolean, readRoles: string[], updateRoles: string[]) {
    const newType: FileType = {
      id,
      name,
      anonymousRead,
      readRoles,
      updateRoles,
    };
    return new FileTypeEntity(newType);
  }

  constructor(type: FileType) {
    this.id = type.id;
    this.name = type.name;
    this.anonymousRead = type.anonymousRead;
    this.readRoles = type.readRoles || [];
    this.updateRoles = type.updateRoles || [];
    this.spaceId = type.spaceId;
  }

  canAccessFile(user: User) {
    return this.anonymousRead || (user && user.roles && !!user.roles.find((role) => this.readRoles.includes(role)));
  }

  canUpdateFile(user: User) {
    return user && user.roles && !!user.roles.find((role) => this.updateRoles.includes(role));
  }

  update(user: User, update: Update<FileType>) {
    if (!this.canUpdate(user)) {
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

  canUpdate(user: User) {
    return (
      (user && user.roles && user.roles.includes(ServiceUserRoles.Admin)) ||
      user.roles.find((role) => this.updateRoles.includes(role))
    );
  }

  getPath(storageRoot: string) {
    return path.join(storageRoot, this.name);
  }

  canAccess(user: User) {
    return this.canAccessFile(user);
  }
}
