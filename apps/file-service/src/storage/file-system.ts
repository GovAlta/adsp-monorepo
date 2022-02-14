import * as appRoot from 'app-root-path';
import { createReadStream, createWriteStream, ReadStream, stat, unlink } from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import { Readable } from 'stream';
import { Logger } from 'winston';
import { FileEntity, FileStorageProvider } from '../file';

export class FileSystemStorageProvider implements FileStorageProvider {
  constructor(private logger: Logger, private storageRoot: string) {}

  async saveFile(entity: FileEntity, content: Readable): Promise<boolean> {
    const filePath = this.getFilePath(entity);
    await mkdirp(path.dirname(filePath));
    return await new Promise<boolean>((resolve) => {
      const stream = createWriteStream(filePath);
      content.pipe(stream);
      stream.on('error', function () {
        resolve(false);
        this.logger.error(`Error on saving file ${entity.filename} (ID: ${entity.id}) to file system at ${filePath}.`, {
          tenant: entity.tenantId?.toString(),
          context: 'FileSystemStorageProvider',
        });
      });
      stream.on('finish', function () {
        stat(filePath, (_err, stats) => {
          entity.setSize(stats.size);
          resolve(true);
        });
      });
    });
  }

  deleteFile(entity: FileEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // Delete the file first to avoid an orphaned file.
      // If the error is file not found, then proceed with deletion of the record.
      const filePath = this.getFilePath(entity);
      unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          this.logger.error(
            `Error on deleting file ${entity.filename} (ID: ${entity.id}) to file system at ${filePath}.`,
            {
              tenant: entity.tenantId?.toString(),
              context: 'FileSystemStorageProvider',
            }
          );
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  async readFile(entity: FileEntity): Promise<ReadStream> {
    const path = this.getFilePath(entity);
    const stream = createReadStream(path);
    stream.on('error', (err) => {
      this.logger.error(
        `Error on reading file ${entity.filename} (ID: ${entity.id}) to file system at ${path}. ${err}`,
        {
          tenant: entity.tenantId?.toString(),
          context: 'FileSystemStorageProvider',
        }
      );
    });
    return stream;
  }

  private getPath(name: string): string {
    const relativePath = path.join(this.storageRoot, name);
    return path.resolve(appRoot.path, relativePath);
  }

  private getFilePath(entity: FileEntity): string {
    const filePath = path.join(entity.tenantId.resource.substring(9), entity.id);
    return this.getPath(filePath);
  }
}
