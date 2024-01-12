import { benchmark } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request } from 'express';
import * as multer from 'multer';
import * as validFilename from 'valid-filename';
import { Logger } from 'winston';
import { ServiceConfiguration } from '../configuration';
import { FileEntity, FileTypeEntity } from '../model';
import { FileRepository } from '../repository';
import { FileStorageProvider } from '../storage';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      fileEntity?: FileEntity;
      fileTypeEntity?: FileTypeEntity;
    }
  }
}

interface UploadProps {
  logger: Logger;
  storageProvider: FileStorageProvider;
  fileRepository: FileRepository;
}

const DEFAULT_MIME_TYPE = 'application/octet-stream';

export class FileStorageEngine implements multer.StorageEngine {
  constructor(
    private logger: Logger,
    private fileRepository: FileRepository,
    private storageProvider: FileStorageProvider
  ) {}

  async _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error?: unknown, info?: Partial<Express.Multer.File>) => void
  ): Promise<void> {
    try {
      // End of the handling happens the request handler where the response is written.
      benchmark(req, 'operation-handler-time');

      const user = req.user;
      const {
        type = null,
        recordId = null,
        filename = null,
        mimeType = DEFAULT_MIME_TYPE,
      } = { ...req.query, ...req.body };

      if (!type) {
        throw new InvalidOperationError('Type of file not specified.');
      }

      if (filename && !validFilename(filename)) {
        throw new InvalidOperationError(`Specified filename is not valid.`);
      }
      const configuration = await req.getConfiguration<ServiceConfiguration, ServiceConfiguration>();
      const fileType = configuration?.[type];
      if (!fileType) {
        throw new NotFoundError('File Type', type);
      }

      if (!fileType.tenantId) {
        throw new InvalidOperationError('Cannot upload file without tenant context.');
      }

      if (!file.stream) {
        this.logger.warn(`Handling file ${filename || file.originalname} upload but stream is not set.`, {
          context: 'FileStorageEngine',
          tenant: fileType.tenantId?.toString(),
        });
        throw new Error('File.stream is not set for upload handler.');
      }

      const fileEntity = await FileEntity.create(
        this.logger,
        this.storageProvider,
        this.fileRepository,
        user,
        fileType,
        {
          filename: filename || file.originalname,
          recordId,
          mimeType,
        },
        file.stream
      );

      req.fileEntity = fileEntity;
      callback();
    } catch (err) {
      callback(err);
    }
  }

  async _removeFile(req: Request, _file: Express.Multer.File, callback: (error: Error) => void): Promise<void> {
    try {
      const entity = req.fileEntity;
      if (entity) {
        await entity.delete(true);
        // This removal does not emit an event since this part of the upload processing.
        callback(null);
      }
    } catch (err) {
      callback(err);
    }
  }
}

export const createUpload = ({ logger, fileRepository, storageProvider }: UploadProps): multer.Multer => {
  const storage = new FileStorageEngine(logger, fileRepository, storageProvider);

  const limits = {
    fields: 10,
    fileSize: 3 * 1024 * 1024 * 1024,
    files: 1,
  };

  return multer({ storage, limits });
};
