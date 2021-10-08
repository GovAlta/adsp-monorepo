import type { AdspId, User } from '@abgov/adsp-service-sdk';
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
  tenantId: AdspId;
  id: string;
  logger?: Logger;
  name: string;
  anonymousRead = false;
  readRoles: string[] = [];
  updateRoles: string[] = [];

  static create(
    tenantId: AdspId,
    id: string,
    name: string,
    anonymousRead: boolean,
    readRoles: string[],
    updateRoles: string[]
  ): FileTypeEntity {
    const newType: FileType = {
      tenantId,
      id,
      name,
      anonymousRead,
      readRoles,
      updateRoles,
    };
    return new FileTypeEntity(newType);
  }

  constructor(type: FileType) {
    this.tenantId = type.tenantId;
    this.id = type.id;
    this.name = type.name;
    this.anonymousRead = type.anonymousRead;
    this.readRoles = type.readRoles || [];
    this.updateRoles = type.updateRoles || [];
  }

  canAccessFile(user: User): boolean {
    return (
      this.anonymousRead ||
      (user?.tenantId?.toString() === this.tenantId.toString() &&
        !!user?.roles?.find(
          (role) => role === ServiceUserRoles.Admin || this.readRoles.includes(role) || this.updateRoles.includes(role)
        ))
    );
  }

  canUpdateFile(user: User): boolean {
    return (
      user?.tenantId?.toString() === this.tenantId.toString() &&
      !!user?.roles?.find((role) => role === ServiceUserRoles.Admin || this.updateRoles.includes(role))
    );
  }

  canAccess(user: User): boolean {
    return this.canAccessFile(user);
  }
}
