import { ENOENT } from 'constants';
import * as path from 'path';
import * as fs from 'fs';
import * as uniqueFilename from 'unique-filename';
import { IsNotEmpty } from 'class-validator';
import { User } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, InvalidOperationError } from '@core-services/core-common';
import { FileRecord, NewFile, UserInfo } from '../types';
import { FileRepository } from '../repository';
import { FileTypeEntity } from './type';
import { v4 as uuidv4 } from 'uuid';
export class FileEntity implements FileRecord {
  id: string;
  recordId: string;
  @IsNotEmpty()
  filename: string;
  size: number;
  storage: string;
  createdBy: UserInfo;
  created: Date;
  lastAccessed?: Date;
  scanned = false;
  deleted = false;

  static async create(
    user: User,
    repository: FileRepository,
    type: FileTypeEntity,
    values: NewFile,
    file: string,
    rootStoragePath: string
  ): Promise<FileEntity> {
    if (!type.canUpdateFile(user)) {
      throw new UnauthorizedError('User not authorized to create file.');
    }

    const entity = new FileEntity(repository, type, {
      ...values,
      created: new Date(),
      createdBy: {
        id: user.id,
        name: user.name,
      },
    });

    return repository.save(entity).then(
      (fileEntity) =>
        new Promise<FileEntity>((resolve, reject) =>
          fs.rename(file, fileEntity.getFilePath(rootStoragePath), (err) => (err ? reject(err) : resolve(fileEntity)))
        )
    );
  }

  constructor(
    private repository: FileRepository,
    public type: FileTypeEntity,
    values: (NewFile & { createdBy: UserInfo; created: Date }) | FileRecord
  ) {
    this.recordId = values.recordId;
    this.filename = values.filename;
    this.createdBy = values.createdBy;
    this.created = values.created;
    this.size = values.size;
    const record = values as FileRecord;
    if (record.id) {
      this.id = record.id;
      this.storage = record.storage;
      this.lastAccessed = record.lastAccessed;
      this.scanned = record.scanned;
      this.deleted = record.deleted;
    } else {
      this.id = uuidv4();
      this.storage = uniqueFilename('');
    }
  }

  markForDeletion(user: User): Promise<FileEntity> {
    if (!this.type.canUpdateFile(user)) {
      throw new UnauthorizedError('User not authorized to delete file.');
    }

    this.deleted = true;
    return this.repository.save(this);
  }

  updateScanResult(infected: boolean): Promise<FileEntity> {
    this.scanned = true;
    if (infected) {
      this.deleted = true;
    }

    return this.repository.save(this);
  }

  delete(rootStoragePath: string): Promise<boolean> {
    if (!this.deleted) {
      throw new InvalidOperationError('File not marked for deletion.');
    }

    const filePath = this.getFilePath(rootStoragePath);
    return new Promise<void>((resolve, reject) =>
      // Delete the file first to avoid an orphaned file.
      // If the error is file not found, then proceed with deletion of the record.
      fs.unlink(filePath, (err) => (err && err.errno !== ENOENT ? reject(err) : resolve()))
    ).then(() => this.repository.delete(this));
  }

  getFilePath(storageRoot: string): string {
    const typePath = this.type.getPath(storageRoot);
    return path.join(typePath, this.storage);
  }

  accessed(date?: Date): Promise<FileEntity> {
    this.lastAccessed = date || new Date();
    return this.repository.save(this);
  }

  canAccess(user: User): boolean {
    return this.type.canAccessFile(user);
  }
}
