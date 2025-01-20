import { AdspId, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import { FileType, ServiceUserRoles, FileTypeRules } from '../types';
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
  securityClassification?: string;
  readRoles: string[] = [];
  updateRoles: string[] = [];
  rules?: FileTypeRules;

  static create(
    tenantId: AdspId,
    id: string,
    name: string,
    anonymousRead: boolean,
    readRoles: string[],
    updateRoles: string[],
    rules?: FileTypeRules,
    securityClassification?: string
  ): FileTypeEntity {
    const newType: FileType = {
      tenantId,
      id,
      name,
      anonymousRead,
      readRoles,
      updateRoles,
      rules,
      securityClassification,
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
    this.rules = type?.rules;
    this.securityClassification = type?.securityClassification;
  }

  canAccessFile(user: User): boolean {
    return this.anonymousRead || isAllowedUser(user, this.tenantId, [ServiceUserRoles.Admin, ...this.readRoles], true);
  }

  canUpdateFile(user: User): boolean {
    return isAllowedUser(user, this.tenantId, [ServiceUserRoles.Admin, ...this.updateRoles], true);
  }

  canAccess(user: User): boolean {
    // This is for whether the user can access the File Type.
    return this.canAccessFile(user) || isAllowedUser(user, this.tenantId, [...this.updateRoles], true);
  }
}
