import { AdspId, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, InvalidOperationError } from '@core-services/core-common';
import { Readable } from 'stream';
import { File, FileRecord, NewFile, ServiceUserRoles, UserInfo } from '../types';
import { FileRepository } from '../repository';
import { FileTypeEntity } from './type';
import { v4 as uuidv4 } from 'uuid';
import { FileStorageProvider } from '../storage';
import { FileTypeDetector } from '../../utils/fileTypeDetector';
import { Logger } from 'winston';

export class FileEntity implements File {
  tenantId: AdspId;
  id: string;
  recordId: string;
  filename: string;
  typeId: string;
  size: number;
  mimeType?: string;
  createdBy: UserInfo;
  created: Date;
  lastAccessed?: Date;
  scanned = false;
  deleted = false;
  infected = false;
  digest?: string;
  securityClassification?: string;

  static async create(
    logger: Logger,
    storageProvider: FileStorageProvider,
    repository: FileRepository,
    user: User,
    type: FileTypeEntity,
    values: NewFile,
    content: Readable
  ): Promise<FileEntity> {
    if (!type.canUpdateFile(user)) {
      throw new UnauthorizedError('User not authorized to create file.');
    }

    let entity = new FileEntity(storageProvider, repository, type, {
      ...values,
      created: new Date(),
      createdBy: {
        id: user.id,
        name: user.name,
      },
    });

    const fileTypeDetector = new FileTypeDetector(logger, content);
    const result = await fileTypeDetector.detect();

    if (result.fileType?.mime) {
      entity.mimeType = result.fileType.mime;
    }

    entity = await repository.save(entity);
    const saved = await storageProvider.saveFile(entity, result.fileStream);
    if (!saved) {
      // Deleted the record if the storage failed to save the file so we don't end up with orphans.
      await entity.delete(true);
      throw new Error(`Storage provider failed to save uploaded file: ${entity.filename}`);
    }

    return entity;
  }

  constructor(
    private storageProvider: FileStorageProvider,
    private repository: FileRepository,
    public type: FileTypeEntity,
    values: (NewFile & { createdBy: UserInfo; created: Date }) | FileRecord
  ) {
    this.recordId = values.recordId;
    this.filename = values.filename;
    this.createdBy = values.createdBy;
    this.created = values.created;
    this.lastAccessed = values.created;
    this.mimeType = values.mimeType;
    const record = values as FileRecord;

    if (record.id) {
      this.typeId = type?.id;
      this.tenantId = record.tenantId;
      this.id = record.id;
      this.lastAccessed = record.lastAccessed;
      this.scanned = record.scanned;
      this.deleted = record.deleted;
      this.infected = record.infected;
      this.size = record.size;
      this.securityClassification = record.securityClassification;
      this.digest = record.digest;
    } else {
      this.tenantId = type.tenantId;
      this.id = uuidv4();
      this.securityClassification = type.securityClassification;
    }
  }

  canAccess(user: User): boolean {
    // User who created a file can always access it again, or
    // Admin user, or
    // User allowed to access based on role configuration on file type.
    return (
      user?.id === this.createdBy.id ||
      isAllowedUser(user, this.tenantId, [ServiceUserRoles.Admin], true) ||
      this.type?.canAccessFile(user)
    );
  }

  canDelete(user: User): boolean {
    // Admin user can delete, or
    // User allowed to update based on role configuration on file type and is original creator.
    return (
      isAllowedUser(user, this.tenantId, [ServiceUserRoles.Admin], true) ||
      (this.type?.canUpdateFile(user) && user.id === this.createdBy.id)
    );
  }

  markForDeletion(user: User): Promise<FileEntity> {
    if (!this.canDelete(user)) {
      throw new UnauthorizedError('User not authorized to delete file.');
    }

    this.deleted = true;
    return this.repository.save(this, { deleted: this.deleted });
  }

  setSize(size: number): Promise<FileEntity> {
    this.size = size;
    return this.repository.save(this, { size: this.size });
  }

  updateScanResult(infected: boolean): Promise<FileEntity> {
    this.scanned = true;
    if (infected) {
      this.infected = true;
    }

    return this.repository.save(this, { scanned: this.scanned, infected: this.infected });
  }

  updateDigest(digest: string): Promise<FileEntity> {
    this.digest = digest;
    return this.repository.save(this, { digest: this.digest });
  }

  async delete(immediate?: boolean): Promise<boolean> {
    if (!immediate && !this.deleted) {
      throw new InvalidOperationError('File not marked for deletion.');
    }

    // Delete the storage first; easier to deal with a record and no file versus other way around.
    const deleted = await this.storageProvider.deleteFile(this);
    if (!deleted) {
      throw new Error(`Storage failed to delete file ${this.filename} (ID: ${this.id}).`);
    }

    return await this.repository.delete(this);
  }

  async readFile(user: User): Promise<Readable> {
    if (!this.canAccess(user)) {
      throw new UnauthorizedError('User not authorized to access file.');
    }

    if (this.deleted) {
      throw new InvalidOperationError('Cannot access file marked for deletion.');
    }

    if (this.infected) {
      throw new InvalidOperationError('Cannot access infected file.');
    }

    const stream = await this.storageProvider.readFile(this);
    this.lastAccessed = new Date();
    await this.repository.save(this, { lastAccessed: this.lastAccessed });

    return stream;
  }

  async copy(user: User, filename?: string, type?: FileTypeEntity, recordId?: string): Promise<FileEntity> {
    type = type || this.type;
    if (!type.canUpdateFile(user)) {
      throw new UnauthorizedError('User not authorized to create file.');
    }

    // Create an save a destination entity first.
    let destination = new FileEntity(this.storageProvider, this.repository, type, {
      filename: filename || this.filename,
      recordId: recordId || this.recordId,
      mimeType: this.mimeType,
      created: new Date(),
      createdBy: {
        id: user.id,
        name: user.name,
      },
    });
    destination = await this.repository.save(destination);

    // Copy the contents via the storage provider; file bytes don't need to be read in this process.
    const saved = await this.storageProvider.copyFile(this, destination);
    if (!saved) {
      await destination.delete(true);
      throw new Error(`Storage provider failed to copy file: ${this.filename} (ID: ${this.id})`);
    }

    return destination;
  }
}
