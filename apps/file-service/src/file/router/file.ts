import * as path from 'path';
import * as appRoot from 'app-root-path';
import { Router } from 'express';
import * as validFilename from 'valid-filename';
import { Logger } from 'winston';
import {
  assertAuthenticatedHandler,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
  AuthAssert,
} from '@core-services/core-common';
import { FileRepository, FileSpaceRepository } from '../repository';
import { FileEntity } from '../model';
import { createUpload } from '../upload';
import { FileCriteria } from '../types/file';
import { EventService } from '@abgov/adsp-service-sdk';
import { fileDeleted, fileUploaded } from '../events';
import { MiddlewareWrapper } from './middlewareWrapper';

interface FileRouterProps {
  logger: Logger;
  rootStoragePath: string;
  spaceRepository: FileSpaceRepository;
  fileRepository: FileRepository;
  eventService: EventService;
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export const createFileRouter = ({
  logger,
  rootStoragePath,
  spaceRepository,
  fileRepository,
  eventService,
}: FileRouterProps): Router => {
  const upload = createUpload({ rootStoragePath });
  const fileRouter = Router();

  fileRouter.post('/files', AuthAssert.assertMethod, upload.single('file'), async (req, res, next) => {
    console.log(JSON.stringify(req.user) + '<req.user');
    const user = req.user;
    const { type, recordId, filename } = req.body;
    const uploaded = req.file;

    console.log(JSON.stringify(req, getCircularReplacer()) + '<reqxxx');

    console.log(JSON.stringify(filename) + '<filename');
    console.log(JSON.stringify(uploaded) + '<uploaded');

    if (filename && !validFilename(filename)) {
      throw new InvalidOperationError(`Specified filename is not valid.`);
    }

    try {
      if (!uploaded || !type) {
        res.sendStatus(400);
      } else {
        const space = await spaceRepository.getIdByTenant(req.tenant);
        const spaceEntity = await spaceRepository.get(space);

        if (!spaceEntity) {
          throw new NotFoundError('Space', space);
        }

        console.log(JSON.stringify(spaceEntity, getCircularReplacer()) + '<spaceEntity');
        console.log(JSON.stringify(spaceEntity.types, getCircularReplacer()) + '<spaceEntity.types');
        console.log(JSON.stringify(type, getCircularReplacer()) + '<type');

        const fileType = spaceEntity.types[type];

        console.log(JSON.stringify(fileType, getCircularReplacer()) + '<fileType');

        if (!fileType) {
          throw new NotFoundError('Type', type);
        }

        console.log(JSON.stringify(user, getCircularReplacer()) + '<user');
        console.log(JSON.stringify(fileRepository, getCircularReplacer()) + '<fileRepository');
        console.log(JSON.stringify(fileType, getCircularReplacer()) + '<fileType');
        console.log(JSON.stringify(filename, getCircularReplacer()) + '<filename');
        console.log(JSON.stringify(uploaded.size, getCircularReplacer()) + '<uploaded.size');
        console.log(JSON.stringify(uploaded, getCircularReplacer()) + '<uploaded');
        console.log(JSON.stringify(uploaded.path, getCircularReplacer()) + '<uploaded.path');
        console.log(JSON.stringify(rootStoragePath, getCircularReplacer()) + '<rootStoragePath');
        const fileEntity = await FileEntity.create(
          user,
          fileRepository,
          fileType,
          {
            filename: filename || uploaded.originalname,
            size: uploaded.size,
            recordId,
          },
          uploaded.path,
          rootStoragePath
        );

        console.log(JSON.stringify(fileEntity, getCircularReplacer()) + '<fileEntity');

        const file = {
          id: fileEntity.id,
          filename: fileEntity.filename,
          size: fileEntity.size,
          typeName: fileEntity.type.name,
          recordId: fileEntity.recordId,
          created: fileEntity.created,
          lastAccessed: fileEntity.lastAccessed,
        };

        console.log(JSON.stringify(file, getCircularReplacer()) + '<file');

        res.json(file);

        // This is an example.
        eventService.send(
          fileUploaded(user, {
            id: fileEntity.id,
            filename: fileEntity.filename,
            size: fileEntity.size,
            recordId: fileEntity.recordId,
            created: fileEntity.created,
            lastAccessed: fileEntity.lastAccessed,
            createdBy: fileEntity.createdBy,
          })
        );

        logger.info(
          `File '${fileEntity.filename}' (ID: ${fileEntity.id}) uploaded by ` + `user '${user.name}' (ID: ${user.id}).`
        );
      }
    } catch (err) {
      next(err);
    }
  });

  fileRouter.get('/files/fileType/:fileTypeId', async (req, res, next) => {
    try {
      const { fileTypeId } = req.params;
      const filesOfType = await fileRepository.exists({
        typeEquals: fileTypeId,
      });

      res.json({
        exist: filesOfType,
      });
    } catch (err) {
      next(err);
    }
  });

  fileRouter.get('/files', MiddlewareWrapper.middlewareMethod, async (req, res, next) => {
    const { top, after } = req.query;

    console.log(JSON.stringify(req.query) + '<req.query');
    console.log(JSON.stringify(top) + '<top');
    console.log(JSON.stringify(after) + '<after');
    console.log(JSON.stringify(req.tenant) + '<req.tenant');

    try {
      const spaceId = await spaceRepository.getIdByTenant(req.tenant);
      if (!spaceId) {
        throw new NotFoundError(`Space Not Found`, spaceId);
      }

      console.log(JSON.stringify(spaceId) + '<spaceId');

      const criteria: FileCriteria = {
        spaceEquals: spaceId,
        deleted: false,
      };
      const files = await fileRepository.find(parseInt((top as string) || '50', 50), after as string, criteria);

      console.log(JSON.stringify(files) + '<files');

      if (!files) {
        console.log(JSON.stringify(`There is no file in ${spaceId}`));
        throw new NotFoundError(`There is no file in ${spaceId}`, spaceId);
      }

      res.send({
        page: files.page,
        results: files.results.map((n) => ({
          id: n.id,
          filename: n.filename,
          size: n.size,
          typeName: n.type.name,
          recordId: n.recordId,
          created: n.created,
          lastAccessed: n.lastAccessed,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  fileRouter.get('/files/:fileId', async (req, res, next) => {
    const user = req.user;
    const { fileId } = req.params;
    try {
      const fileEntity = await fileRepository.get(fileId);

      if (!fileEntity) {
        throw new NotFoundError('File', fileId);
      } else if (!fileEntity.canAccess(user)) {
        throw new UnauthorizedError('User not authorized to access file.');
      }

      res.json({
        id: fileEntity.id,
        filename: fileEntity.filename,
        size: fileEntity.size,
        typeName: fileEntity.type.name,
        recordId: fileEntity.recordId,
        created: fileEntity.created,
        lastAccessed: fileEntity.lastAccessed,
        scanned: fileEntity.scanned,
        deleted: fileEntity.deleted,
      });
    } catch (err) {
      next(err);
    }
  });

  fileRouter.get('/files/:fileId/download', async (req, res, next) => {
    const user = req.user;
    const { fileId } = req.params;
    try {
      const fileEntity = await fileRepository.get(fileId);
      if (!fileEntity || fileEntity.deleted) {
        throw new NotFoundError('File', fileId);
      } else if (!fileEntity.canAccess(user)) {
        throw new UnauthorizedError('User not authorized to access file.');
      } else if (!fileEntity.scanned) {
        throw new InvalidOperationError('File scan pending.');
      } else {
        const filePath = path.resolve(`${appRoot}`, await fileEntity.getFilePath(rootStoragePath));
        res.sendFile(filePath, {
          headers: {
            'Content-Disposition': `attachment; filename="${fileEntity.filename}"`,
            'Cache-Control': 'public',
          },
        });
        fileEntity.accessed();
      }
    } catch (err) {
      next(err);
    }
  });

  fileRouter.delete('/files/:fileId', assertAuthenticatedHandler, async (req, res, next) => {
    const user = req.user;
    const { fileId } = req.params;
    try {
      const fileEntity = await fileRepository.get(fileId);

      if (!fileEntity) {
        throw new NotFoundError('File', fileId);
      }
      await fileEntity.markForDeletion(user);

      logger.info(
        `File '${fileEntity.filename}' (ID: ${fileEntity.id}) marked for deletion by ` +
          `user '${user.name}' (ID: ${user.id}).`
      );

      res.json({ deleted: fileEntity.deleted });

      eventService.send(
        fileDeleted(user, {
          id: fileEntity.id,
          filename: fileEntity.filename,
          size: fileEntity.size,
          recordId: fileEntity.recordId,
          created: fileEntity.created,
          lastAccessed: fileEntity.lastAccessed,
          createdBy: fileEntity.createdBy,
        })
      );
    } catch (err) {
      next(err);
    }
  });

  return fileRouter;
};
