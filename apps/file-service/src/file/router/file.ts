import {
  adspId,
  AdspId,
  benchmark,
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
import { param, query } from 'express-validator';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { FileEntity, FileTypeEntity } from '../model';
import { createUpload } from './upload';
import { fileDeleted, fileUploaded } from '../events';
import { ServiceConfiguration } from '../configuration';
import { FileStorageProvider } from '../storage';
import { FileCriteria } from '../types';
import validator from 'validator';

interface FileRouterProps {
  serviceId: AdspId;
  logger: Logger;
  storageProvider: FileStorageProvider;
  fileRepository: FileRepository;
  eventService: EventService;
}

function mapFileType(entity: FileTypeEntity) {
  return {
    id: entity.id,
    name: entity.name,
    anonymousRead: entity.anonymousRead,
    updateRoles: entity.updateRoles,
    readRoles: entity.readRoles,
    rules: entity?.rules,
  };
}

function mapFile(apiId: AdspId, entity: FileEntity, entityFileType?: FileTypeEntity) {
  const mappedFile = {
    urn: adspId`${apiId}:/files/${entity.id}`.toString(),
    id: entity.id,
    filename: entity.filename,
    size: entity.size,
    typeName: entity.type?.name,
    recordId: entity.recordId,
    created: entity.created,
    createdBy: entity.createdBy,
    lastAccessed: entity.lastAccessed,
    scanned: entity.scanned,
    infected: entity.infected,
    securityClassification: '',
  };

  // For old files Security Classification doesnt exist.
  // So, if they have updated the File Types with a security classification
  // then the security classification should be added to the object.
  if (entity?.typeId && entity.securityClassification !== undefined) {
    return {
      ...mappedFile,
      securityClassification: entity.securityClassification,
    };
  }
  if (entity?.typeId && entityFileType?.securityClassification !== undefined) {
    return {
      ...mappedFile,
      securityClassification: entityFileType.securityClassification,
    };
  }

  return mappedFile;
}

function getTypeOnRequest(_logger: Logger): RequestHandler {
  return async (req, _res, next) => {
    try {
      const user = req.user;
      const fileEntity = req.fileEntity;
      const configuration = await req.getConfiguration<ServiceConfiguration, ServiceConfiguration>();
      const entity = configuration?.[fileEntity.typeId];

      if (!entity) {
        throw new NotFoundError('File Type', fileEntity.typeId);
      } else if (!entity.canAccess(user)) {
        throw new UnauthorizedUserError('Access file type', user);
      }

      req.fileTypeEntity = entity;
      next();
    } catch (err) {
      next(err);
    }
  };
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
      req.fileTypeEntity = entity;
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
      const fileTypeEntity = req.fileTypeEntity;

      if (!fileEntity) {
        throw new InvalidOperationError('No file uploaded.');
      }

      // Start of the handling happens in the upload (multer storage engine).
      benchmark(req, 'operation-handler-time');
      const mappedFile = mapFile(apiId, fileEntity);
      res.send(mappedFile);

      eventService.send(
        fileUploaded(fileEntity.tenantId, user, {
          id: fileEntity.id,
          filename: fileEntity.filename,
          size: fileEntity.size,
          recordId: fileEntity.recordId,
          created: fileEntity.created,
          lastAccessed: fileEntity.lastAccessed,
          createdBy: fileEntity.createdBy,
          securityClassification: fileTypeEntity.securityClassification,
        })
      );

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

      const configuration = await req.getConfiguration<ServiceConfiguration, ServiceConfiguration>();
      if (fileEntity.typeId) {
        const fileType = configuration?.[fileEntity?.typeId];

        if (fileType) {
          req.fileTypeEntity = fileType;
        }
      }
      req.fileEntity = fileEntity;

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
      res.setHeader('Content-Type', fileEntity.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', fileEntity.size);
      if (embed === 'true') {
        res.setHeader('Cache-Control', fileEntity.type?.anonymousRead ? 'public' : 'no-store');
        res.setHeader('Content-Disposition', 'inline');
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

function isSupportedVideoType(mimeType: string): boolean {
  // supporting mp4, avi, or mov
  return mimeType === 'video/mp4' || mimeType === 'video/x-msvideo' || mimeType === 'video/quicktime';
}

export function deleteFile(logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const fileEntity = req.fileEntity;
      const fileTypeEntity = req.fileTypeEntity;
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

      eventService.send(
        fileDeleted(user, {
          id: fileEntity.id,
          filename: fileEntity.filename,
          size: fileEntity.size,
          recordId: fileEntity.recordId,
          created: fileEntity.created,
          lastAccessed: fileEntity.lastAccessed,
          createdBy: fileEntity.createdBy,
          securityClassification: fileTypeEntity.securityClassification,
        })
      );
    } catch (err) {
      next(err);
    }
  };
  ``;
}

export const createFileRouter = ({
  serviceId,
  logger,
  storageProvider,
  fileRepository,
  eventService,
}: FileRouterProps): Router => {
  const apiId = adspId`${serviceId}:v1`;

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
  fileRouter.post(
    '/files',
    assertAuthenticatedHandler,
    upload.single('file'),
    getTypeOnRequest(logger),
    uploadFile(apiId, logger, eventService)
  );

  fileRouter.delete(
    '/files/:fileId',
    assertAuthenticatedHandler,
    createValidationHandler(param('fileId').isUUID()),
    getFile(fileRepository),
    deleteFile(logger, eventService)
  );
  fileRouter.get(
    '/files/:fileId',
    createValidationHandler(param('fileId').isUUID()),
    getFile(fileRepository),
    (req: Request, res: Response) => res.send(mapFile(apiId, req.fileEntity, req.fileTypeEntity))
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
