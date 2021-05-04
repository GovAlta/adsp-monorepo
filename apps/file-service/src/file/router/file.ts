import * as path from 'path';
import * as appRoot from 'app-root-path';
import { Router } from 'express';
import * as validFilename from 'valid-filename';
import { Logger } from 'winston';
import {
  User,
  assertAuthenticatedHandler,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
  DomainEventService,
  platformURNs,
} from '@core-services/core-common';
import { FileRepository, FileSpaceRepository } from '../repository';
import { FileEntity } from '../model';
import { createUpload } from '../upload';
import { createdFile, deletedFile } from '../event';
import { FileCriteria } from '../types/file';

interface FileRouterProps {
  logger: Logger;
  rootStoragePath: string;
  eventService: DomainEventService;
  spaceRepository: FileSpaceRepository;
  fileRepository: FileRepository;
}

export const createFileRouter = ({
  logger,
  rootStoragePath,
  eventService,
  spaceRepository,
  fileRepository,
}: FileRouterProps) => {
  const upload = createUpload({ rootStoragePath });
  const fileRouter = Router();

  fileRouter.post('/files', assertAuthenticatedHandler, upload.single('file'), async (req, res, next) => {
    const user = req.user as User;
    const { type, recordId, filename } = req.body;
    const uploaded = req.file;

    if (filename && !validFilename(filename)) {
      throw new InvalidOperationError(`Specified filename is not valid.`);
    }

    try {
      if (!uploaded || !type) {
        res.sendStatus(400);
      } else {
        const space = await spaceRepository.getIdByName(user.tenantName);
        const spaceEntity = await spaceRepository.get(space);

        if (!spaceEntity) {
          throw new NotFoundError('Space', space);
        }

        const fileType = spaceEntity.types[type];

        if (!fileType) {
          throw new NotFoundError('Type', type);
        }
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
        eventService.send(
          createdFile(space, type, {
            id: fileEntity.id,
            filename: fileEntity.filename,
            size: fileEntity.size,
            recordId: fileEntity.recordId,
            createdBy: fileEntity.createdBy,
            created: fileEntity.created,
            scanned: fileEntity.scanned,
          })
        );

        res.json({
          id: fileEntity.id,
          filename: fileEntity.filename,
          size: fileEntity.size,
          typeName: fileEntity.type.name,
          recordId: fileEntity.recordId,
          created: fileEntity.created,
          lastAccessed: fileEntity.lastAccessed,
          fileURN: `${platformURNs['file-service']}:${spaceEntity.name}/supporting-doc/${fileEntity.id}`,
        });

        logger.info(
          `File '${fileEntity.filename}' (ID: ${fileEntity.id}) uploaded by ` + `user '${user.name}' (ID: ${user.id}).`
        );
      }
    } catch (err) {
      next(err);
    }
  });

  fileRouter.get('/files', async (req, res, next) => {
    const user = req.user as User;
    const { top, after } = req.query;

    try {
      const spaceId = await spaceRepository.getIdByName(user.tenantName);

      if (!spaceId) {
        throw new NotFoundError(`Space Not Found`, spaceId);
      }

      const criteria: FileCriteria = {
        spaceEquals: spaceId,
        deleted: false,
      };
      const files = await fileRepository.find(parseInt((top as string) || '50', 50), after as string, criteria);

      if (!files) {
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
          fileURN: `${platformURNs['file-service']}:${user.tenantName}/supporting-doc/${n.id}`,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  fileRouter.get('/files/:fileId', async (req, res, next) => {
    const user = req.user as User;
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
        fileURN: `${platformURNs['file-service']}:${user.tenantName}/supporting-doc/${fileEntity.id}`,
        scanned: fileEntity.scanned,
        deleted: fileEntity.deleted,
      });
    } catch (err) {
      next(err);
    }
  });

  fileRouter.get('/files/:fileId/download', async (req, res, next) => {
    const user = req.user as User;
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
    const user = req.user as User;
    const { fileId } = req.params;
    try {
      const fileEntity = await fileRepository.get(fileId);

      if (!fileEntity) {
        throw new NotFoundError('File', fileId);
      }
      fileEntity.markForDeletion(user);

      eventService.send(
        deletedFile(
          fileEntity.type.spaceId,
          fileEntity.type.id,
          {
            id: fileEntity.id,
            filename: fileEntity.filename,
            size: fileEntity.size,
            recordId: fileEntity.recordId,
            createdBy: fileEntity.createdBy,
            created: fileEntity.created,
            scanned: fileEntity.scanned,
          },
          user,
          new Date()
        )
      );

      logger.info(
        `File '${fileEntity.filename}' (ID: ${fileEntity.id}) marked for deletion by ` +
          `user '${user.name}' (ID: ${user.id}).`
      );

      res.json({ deleted: fileEntity.deleted });
    } catch (err) {
      next(err);
    }
  });

  return fileRouter;
};
