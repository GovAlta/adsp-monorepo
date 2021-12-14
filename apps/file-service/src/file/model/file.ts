import { AdspId, User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, InvalidOperationError } from '@core-services/core-common';
import { Readable } from 'stream';
import { File, FileRecord, NewFile, UserInfo } from '../types';
import { FileRepository } from '../repository';
import { FileTypeEntity } from './type';
import { v4 as uuidv4 } from 'uuid';
import { FileStorageProvider } from '../storage';

export class FileEntity implements File {
  tenantId: AdspId;
  id: string;
  recordId: string;
  filename: string;
  size: number;
  createdBy: UserInfo;
  created: Date;
  lastAccessed?: Date;
  scanned = false;
  deleted = false;
  infected = false;

  static async create(
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

    entity = await repository.save(entity);
    const saved = await storageProvider.saveFile(entity, content);
    if (!saved) {
      // Deleted the record if the storage failed to save the file so we don't end up with orphans.
      await entity.delete(true);
      throw new Error(`Storage provide failed to save uploaded file: ${entity.filename}`);
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
    const record = values as FileRecord;

    if (record.id) {
      this.tenantId = record.tenantId;
      this.id = record.id;
      this.lastAccessed = record.lastAccessed;
      this.scanned = record.scanned;
      this.deleted = record.deleted;
      this.infected = record.infected;
      this.size = record.size;
    } else {
      this.tenantId = type.tenantId;
      this.id = uuidv4();
    }
  }

  canAccess(user: User): boolean {
    return this.type.canAccessFile(user);
  }

  canUpdate(user: User): boolean {
    return this.type.canUpdateFile(user);
  }

  markForDeletion(user: User): Promise<FileEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to delete file.');
    }

    this.deleted = true;
    return this.repository.save(this);
  }

  setSize(size: number): Promise<FileEntity> {
    this.size = size;
    return this.repository.save(this);
  }

  updateScanResult(infected: boolean): Promise<FileEntity> {
    this.scanned = true;
    if (infected) {
      this.infected = true;
    }

    return this.repository.save(this);
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
    await this.repository.save(this);

    return stream;
  }
}
