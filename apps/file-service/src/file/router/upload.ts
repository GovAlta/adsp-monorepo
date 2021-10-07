import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request } from 'express';
import * as multer from 'multer';
import * as validFilename from 'valid-filename';
import { ServiceConfiguration } from '../configuration';
import { FileEntity } from '../model';
import { FileRepository } from '../repository';
import { FileStorageProvider } from '../storage';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      fileEntity?: FileEntity;
    }
  }
}

interface UploadProps {
  storageProvider: FileStorageProvider;
  fileRepository: FileRepository;
}

export class FileStorageEngine implements multer.StorageEngine {
  constructor(private fileRepository: FileRepository, private storageProvider: FileStorageProvider) {}

  async _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error?: unknown, info?: Partial<Express.Multer.File>) => void
  ): Promise<void> {
    try {
      const user = req.user;
      const { type = null, recordId = null, filename = null } = { ...req.query, ...req.body };

      if (!type) {
        throw new InvalidOperationError('Type of file not specified.');
      }

      if (filename && !validFilename(filename)) {
        throw new InvalidOperationError(`Specified filename is not valid.`);
      }
      const [configuration] = await req.getConfiguration<ServiceConfiguration>();

      const fileType = configuration?.[type];
      if (!fileType) {
        throw new NotFoundError('File Type', type);
      }

      const fileEntity = await FileEntity.create(
        this.storageProvider,
        this.fileRepository,
        user,
        fileType,
        {
          filename: filename || file.originalname,
          recordId,
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

export const createUpload = ({ fileRepository, storageProvider }: UploadProps): multer.Multer => {
  const storage = new FileStorageEngine(fileRepository, storageProvider);

  const limits = {
    fields: 10,
    fileSize: 26214400,
    files: 1,
  };

  return multer({ storage, limits });
};
