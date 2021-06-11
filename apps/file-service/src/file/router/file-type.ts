import { Router } from 'express';
import { Logger } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import { assertAuthenticatedHandler, NotFoundError, InvalidOperationError } from '@core-services/core-common';
import { FileRepository, FileSpaceRepository } from '../repository';
import { FileSpaceEntity } from '../model';

import { fileServiceAdminMiddleware } from '../middleware/authentication';
interface FileTypeRouterProps {
  logger: Logger;
  spaceRepository: FileSpaceRepository;
  fileRepository: FileRepository;
  rootStoragePath: string;
}

export const createFileTypeRouter = ({
  logger,
  spaceRepository,
  rootStoragePath,
  fileRepository,
}: FileTypeRouterProps): Router => {
  const fileTypeRouter = Router();

  fileTypeRouter.post('/fileTypes', fileServiceAdminMiddleware, async (req, res, next) => {
    const user = req.user;

    const { name, anonymousRead, readRoles = [], updateRoles = [] } = req.body;

    if (!name) {
      res.sendStatus(HttpStatusCodes.BAD_REQUEST);
    } else {
      try {
        const spaceId = await spaceRepository.getIdByTenant(req.tenant);
        if (!spaceId) {
          throw new NotFoundError('File space', null);
        }

        const spaceEntity: FileSpaceEntity = await spaceRepository.get(spaceId);
        if (name in spaceEntity.types) {
          throw new InvalidOperationError(`Duplicated type name: ${name}`);
        }

        const id = uuidv4();

        const space = await spaceEntity.addType(user, rootStoragePath, id, {
          name,
          anonymousRead,
          readRoles,
          updateRoles,
        });

        res.json(space.types[id]);
      } catch (err) {
        const errMessage = `Error creating type: ${err.message}`;
        logger.error(errMessage);
        res.statusMessage = errMessage;
        res.status(400);
        next(res);
      }
    }
  });

  fileTypeRouter.get('/fileTypes/:fileTypeId', async (req, res, next) => {
    const { fileTypeId } = req.params;

    try {
      const spaceId = await spaceRepository.getIdByTenant(req.tenant);
      if (!spaceId) {
        throw new NotFoundError('File Type', fileTypeId);
      }

      const space: FileSpaceEntity = await spaceRepository.get(spaceId);
      for (const k in space.types) {
        if (space.types[k].id === fileTypeId) {
          res.json(space.types[k]);
        }
      }
      throw new NotFoundError('File Type', fileTypeId);
    } catch (err) {
      const errMessage = `Error fetching type: ${err.message}`;

      logger.error(errMessage);
      res.statusMessage = errMessage;
      next(err);
    }
  });

  fileTypeRouter.get('/fileTypes', fileServiceAdminMiddleware, async (req, res, next) => {
    try {
      const spaceId = await spaceRepository.getIdByTenant(req.tenant);
      if (!spaceId) {
        throw new NotFoundError('File Type', null);
      }

      const space: FileSpaceEntity = await spaceRepository.get(spaceId);

      res.json(Object.values(space.types));
    } catch (err) {
      const errMessage = `Error fetching type: ${err.message}`;
      logger.error(errMessage);
      res.statusMessage = errMessage;
      res.status(400);
      next(res);
    }
  });

  fileTypeRouter.put('/fileTypes/:fileTypeId', assertAuthenticatedHandler, async (req, res, next) => {
    const user = req.user;
    const { fileTypeId } = req.params;

    const { updateRoles, readRoles, anonymousRead, name } = req.body;

    try {
      const spaceId = await spaceRepository.getIdByTenant(req.tenant);
      if (!spaceId) {
        throw new NotFoundError('File Space', null);
      }

      const spaceEntity: FileSpaceEntity = await spaceRepository.get(spaceId);

      if (!Object.values(spaceEntity.types).find((type) => type.id === fileTypeId)) {
        throw new NotFoundError(`File Type`, fileTypeId);
      }

      const space = await spaceEntity.updateType(user, fileTypeId, {
        name,
        anonymousRead,
        readRoles,
        updateRoles,
      });

      res.json(Object.values(space.types).find((type) => type.id === fileTypeId));
    } catch (err) {
      const errMessage = `Error updating type: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  });

  fileTypeRouter.delete('/fileTypes/:fileTypeId', assertAuthenticatedHandler, async (req, res, next) => {
    const { fileTypeId } = req.params;
    const user = req.user;
    try {
      const spaceId = await spaceRepository.getIdByTenant(req.tenant);
      if (!spaceId) {
        throw new NotFoundError(`Could not find space for ${user.name}`, fileTypeId);
      }
      const spaceEntity: FileSpaceEntity = await spaceRepository.get(spaceId);
      const filesOfType = await fileRepository.exists({
        typeEquals: fileTypeId,
      });
      if (filesOfType) {
        const deletedItem = await spaceEntity.deleteType(user, fileTypeId);
        res.json(deletedItem);
      } else {
        const markForDelete = await fileRepository.exists({
          typeEquals: fileTypeId,
          deleted: true,
        });
        if (markForDelete) {
          throw new InvalidOperationError(`There are mark for delete files, please try delete ${fileTypeId} later.`);
        }
        throw new InvalidOperationError(`There are uploaded files of this File Type`);
      }
    } catch (err) {
      const errMessage = `Failed deleting type: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  });

  return fileTypeRouter;
};
