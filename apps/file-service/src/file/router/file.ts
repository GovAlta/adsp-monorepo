import {
  AdspId,
  benchmark,
  DomainEvent,
  EventService,
  startBenchmark,
  UnauthorizedUserError,
} from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
  createValidationHandler,
  decodeAfter,
} from '@core-services/core-common';
import { Request, RequestHandler, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { createUpload } from './upload';
import { fileDeleted, fileUploaded } from '../events';
import { ServiceConfiguration } from '../configuration';
import { FileStorageProvider } from '../storage';
import { FileCriteria } from '../types';
import validator from 'validator';
import { mapFile, mapFileType } from '../mapper';
import { FileTypeEntity } from '../model';

interface FileRouterProps {
  apiId: AdspId;
  logger: Logger;
  storageProvider: FileStorageProvider;
  fileRepository: FileRepository;
  eventService: EventService;
}

export const getTypes: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const configuration = await req.getConfiguration<ServiceConfiguration, ServiceConfiguration>();

    res.send(
      Object.values(configuration)
        .filter((t) => t.canAccess(user))
        .map(mapFileType)
    );
  } catch (err) {
    next(res);
  }
};

export function getType(_logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { fileTypeId } = req.params;
      const configuration = await req.getConfiguration<ServiceConfiguration, ServiceConfiguration>();

      const entity = configuration?.[fileTypeId];
      if (!entity) {
        throw new NotFoundError('File Type', fileTypeId);
      } else if (!entity.canAccess(user)) {
        throw new UnauthorizedUserError('Access file type', user);
      }
      res.send(mapFileType(entity));
    } catch (err) {
      next(err);
    }
  };
}

export function getFiles(apiId: AdspId, repository: FileRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        throw new InvalidOperationError('Cannot get files without a tenant context.');
      }

      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 50;
      let criteria: FileCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};
      criteria = {
        ...criteria,
        deleted: false,
      };

      const files = await repository.find(tenantId, top, after as string, criteria);

      end();
      res.send({
        page: files.page,
        results: files.results.filter((r) => r.canAccess(user)).map((f) => mapFile(apiId, f)),
      });
    } catch (err) {
      next(err);
    }
  };
}

export function uploadFile(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const fileEntity = req.fileEntity;

      if (!fileEntity) {
        throw new InvalidOperationError('No file uploaded.');
      }

      // Start of the handling happens in the upload (multer storage engine).
      benchmark(req, 'operation-handler-time');
      const mappedFile = mapFile(apiId, fileEntity);

      res.send(mappedFile);

      eventService.send(fileUploaded(apiId, user, fileEntity));

      logger.info(
        `File '${fileEntity.filename}' (ID: ${fileEntity.id}) uploaded by user '${user.name}' (ID: ${user.id}).`,
        {
          context: 'file-router',
          tenant: fileEntity.tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

export function getFile(repository: FileRepository): RequestHandler {
  return async (req, _res, next) => {
    try {
      const end = startBenchmark(req, 'get-entity-time');

      const user = req.user;
      const { fileId } = req.params;

      const fileEntity = await repository.get(fileId);

      if (!fileEntity) {
        throw new NotFoundError('File', fileId);
      } else if (!fileEntity.canAccess(user)) {
        throw new UnauthorizedError('User not authorized to access file.');
      }

      req.fileEntity = fileEntity;

      // This is to record the timing metric against the tenant of the file for anonymous download.
      if (!req.tenant) {
        req.tenant = { id: fileEntity.tenantId, name: null, realm: null };
      }

      end();
      next();
    } catch (err) {
      next(err);
    }
  };
}

// This is from mozilla example of RFC 5987 encode; not sure why it's not a standard function.
function encodeRFC5987(value: string) {
  return encodeURIComponent(value)
    .replace(/['()]/g, escape)
    .replace(/\*/g, '%2A')
    .replace(/%(?:7C|60|5E)/g, unescape);
}

export function downloadFile(logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const { unsafe, embed } = req.query;
      const fileEntity = req.fileEntity;
      if (unsafe !== 'true' && !fileEntity.scanned) {
        throw new InvalidOperationError('File scan pending.');
      }

      const stream = await fileEntity.readFile(user);

      end();

      res.status(200);
      res.setHeader('Content-Type', validateMimeType(fileEntity.mimeType));
      res.setHeader('Content-Length', fileEntity.size);

      if (embed === 'true') {
        res.setHeader('Cache-Control', fileEntity.type.anonymousRead ? 'public' : 'no-store');
        res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeRFC5987(fileEntity.filename)}`);
      } else {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeRFC5987(fileEntity.filename)}`);
      }

      if (isSupportedVideoType(fileEntity.mimeType)) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Connection', 'keep-alive');
      }

      stream.on('end', () => {
        logger.debug(`Ending streaming of file '${fileEntity.filename}' (ID: ${fileEntity.id}).`, {
          context: 'file-router',
          tenant: fileEntity.tenantId?.toString(),
          user: user ? `${user.name} (ID: ${user.id})` : null,
        });
        res.end();
      });
      stream.pipe(res, { end: false });
    } catch (err) {
      next(err);
    }
  };
}
function validateMimeType(mimeType: string) {
  if (!mimeType) return 'application/octet-stream';

  // Need to add base64 to the end of the mime so that the pdf can embed the svg correctly.
  if (mimeType.indexOf('image/svg+xml') >= 0) {
    mimeType = `${mimeType};base64`;
  }
  return mimeType;
}

function isSupportedVideoType(mimeType: string): boolean {
  // supporting mp4, avi, or mov
  return mimeType === 'video/mp4' || mimeType === 'video/x-msvideo' || mimeType === 'video/quicktime';
}

export function deleteFile(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const fileEntity = req.fileEntity;
      await fileEntity.markForDeletion(user);

      logger.info(
        `File '${fileEntity.filename}' (ID: ${fileEntity.id}) marked for deletion by ` +
          `user '${user.name}' (ID: ${user.id}).`,
        {
          context: 'file-router',
          tenant: fileEntity.tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );

      end();
      res.send({ deleted: fileEntity.deleted });

      eventService.send(fileDeleted(apiId, user, fileEntity));
    } catch (err) {
      next(err);
    }
  };
}

export function fileOperation(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const { operation } = req.body;
      const fileEntity = req.fileEntity;

      let result: unknown, event: DomainEvent;
      switch (operation) {
        case 'copy': {
          const { filename, type, recordId } = req.body;
          let fileType: FileTypeEntity = null;
          if (type) {
            const configuration = await req.getConfiguration<ServiceConfiguration, ServiceConfiguration>();
            fileType = configuration?.[type];
            if (!fileType) {
              throw new NotFoundError('File Type', type);
            }
          }

          const copy = await fileEntity.copy(user, filename, fileType, recordId);
          result = mapFile(apiId, copy);
          event = fileUploaded(apiId, user, copy);

          logger.info(
            `File '${fileEntity.filename}' (ID: ${fileEntity.id}) copied to '${copy.filename}' (ID: ${copy.id}) by ` +
              `user '${user.name}' (ID: ${user.id}).`,
            {
              context: 'file-router',
              tenant: fileEntity.tenantId?.toString(),
              user: `${user.name} (ID: ${user.id})`,
            }
          );
          break;
        }
        default:
          throw new InvalidOperationError(`File operation '${operation}' not recognized.`);
      }

      end();
      res.send(result);

      if (event) {
        eventService.send(event);
      }
    } catch (err) {
      next(err);
    }
  };
}

export const createFileRouter = ({
  apiId,
  logger,
  storageProvider,
  fileRepository,
  eventService,
}: FileRouterProps): Router => {
  const upload = createUpload({ logger, storageProvider, fileRepository });
  const fileRouter = Router();

  fileRouter.get('/types', assertAuthenticatedHandler, getTypes);
  fileRouter.get('/types/:fileTypeId', assertAuthenticatedHandler, getType(logger));

  fileRouter.get(
    '/files',
    assertAuthenticatedHandler,
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        }),
      query('criteria')
        .optional()
        .custom(async (value) => {
          const criteria = JSON.parse(value);

          if (criteria?.lastAccessedBefore !== undefined) {
            if (!validator.isISO8601(criteria?.lastAccessedBefore)) {
              throw new InvalidOperationError('lastAccessedBefore requires ISO-8061 date string.');
            }
          }
          if (criteria?.lastAccessedAfter !== undefined) {
            if (!validator.isISO8601(criteria?.lastAccessedAfter)) {
              throw new InvalidOperationError('lastAccessedBefore requires ISO-8061 date string.');
            }
          }
        })
    ),
    getFiles(apiId, fileRepository)
  );
  fileRouter.post('/files', assertAuthenticatedHandler, upload.single('file'), uploadFile(apiId, logger, eventService));

  fileRouter.get(
    '/files/:fileId',
    createValidationHandler(param('fileId').isUUID()),
    getFile(fileRepository),
    (req: Request, res: Response) => res.send(mapFile(apiId, req.fileEntity))
  );
  fileRouter.delete(
    '/files/:fileId',
    assertAuthenticatedHandler,
    createValidationHandler(param('fileId').isUUID()),
    getFile(fileRepository),
    deleteFile(apiId, logger, eventService)
  );
  fileRouter.post(
    '/files/:fileId',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('fileId').isUUID(),
      body('operation').isIn(['copy']),
      body('type').optional({ nullable: true }).isString().isLength({ min: 1, max: 50 }),
      body('filename').optional({ nullable: true }).isString(),
      body('recordId').optional({ nullable: true }).isString()
    ),
    getFile(fileRepository),
    fileOperation(apiId, logger, eventService)
  );

  fileRouter.get(
    '/files/:fileId/download',
    createValidationHandler(
      param('fileId').isUUID(),
      query('unsafe').optional().isBoolean(),
      query('embed').optional().isBoolean()
    ),
    getFile(fileRepository),
    downloadFile(logger)
  );

  return fileRouter;
};
