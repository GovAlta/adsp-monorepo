import { Router } from 'express';
import { Logger } from 'winston';
import {
  User,
  assertAuthenticatedHandler,
  NotFoundError,
  DomainEventService,
  InvalidOperationError,
} from '@core-services/core-common';
import { FileSpaceRepository } from '../repository';
import { FileSpaceEntity } from '../model';
import * as HttpStatusCodes from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import { MongoFileRepository } from '../../mongo/file';

import { fileServiceAdminMiddleware } from '../middleware/authentication';
interface FileTypeRouterProps {
  logger: Logger;
  eventService: DomainEventService;
  spaceRepository: FileSpaceRepository;
  rootStoragePath: string;
}

export const createFileTypeRouter = ({ logger, spaceRepository, rootStoragePath }: FileTypeRouterProps) => {
  const fileTypeRouter = Router();
  /**
   * @swagger
   *
   * /file-type/v1/fileTypes:
   *   post:
   *     tags:
   *     - File
   *     description: Upload a file.
   *     requestBody:
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               space:
   *                 type: string
   *                 description: Space to upload the file to.
   *               type:
   *                 type: string
   *                 description: Type of the file.
   *               recordId:
   *                 type: string
   *                 description: ID of the record associated with the file.
   *               filename:
   *                 type: string
   *                 description: Name of the file.
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Contents of the file.
   *     responses:
   *       200:
   *         description: File successfully uploaded.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 filename:
   *                   type: string
   *                 size:
   *                   type: number
   *       400:
   *         description: Invalid parameters.
   *       404:
   *         description: Space or type not found.
   *
   *
   */
  fileTypeRouter.post('/fileTypes', fileServiceAdminMiddleware, async (req, res, next) => {
    const user = req.user as User;

    const { name, anonymousRead, readRoles = [], updateRoles = [] } = req.body;

    if (!name) {
      res.sendStatus(HttpStatusCodes.BAD_REQUEST);
    } else {
      try {
        const spaceId = await spaceRepository.getIdByName(user.tenantName);

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

  /**
   * @swagger
   *
   * /file-type/v1/fileTypes:
   *   get:
   *     tags:
   *     - File
   *     description: Retrieves a file's metadata.
   *     parameters:
   *     - name: fileId
   *       description: ID of the file to retrieve.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: File metadata
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 filename:
   *                   type: string
   *                 size:
   *                   type: number
   *                 scanned:
   *                   type: boolean
   *                 deleted:
   *                   type: boolean
   *       404:
   *         description: file not found
   */
  fileTypeRouter.get('/fileTypes/:fileTypeId', async (req, res, next) => {
    const { fileTypeId } = req.params;
    const user = req.user as User;

    try {
      const tenantName = user.tenantName;
      const spaceId = await spaceRepository.getIdByName(tenantName);
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
      res.status(400);
      next(res);
    }
  });

  fileTypeRouter.get('/fileTypes', fileServiceAdminMiddleware, async (req, res, next) => {
    const user = req.user as User;

    try {
      const tenantName = user.tenantName;

      const spaceId = await spaceRepository.getIdByName(tenantName);

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
    const user = req.user as User;
    const { fileTypeId } = req.params;

    const { updateRoles, readRoles, anonymousRead, name } = req.body;

    try {
      const tenantName = user.tenantName;
      const spaceId = await spaceRepository.getIdByName(tenantName);

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
      res.statusMessage = errMessage;
      res.status(400);
      next(res);
    }
  });

  /**
   * @swagger
   *
   * /file/v1/files/{fileId}:
   *   delete:
   *     tags:
   *     - File
   *     description: Marks a file for deletion.
   *     parameters:
   *     - name: fileId
   *       description: ID of the file to delete.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Delete result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 deleted:
   *                   type: boolean
   *       404:
   *         description: file not found
   */
  fileTypeRouter.delete('/fileTypes/:fileTypeId', assertAuthenticatedHandler, async (req, res, next) => {
    const { fileTypeId } = req.params;
    const user = req.user as User;

    try {
      const spaceId = await spaceRepository.getIdByName(user.tenantName);
      if (!spaceId) {
        throw new NotFoundError('File Type', fileTypeId);
      }
      const spaceEntity: FileSpaceEntity = await spaceRepository.get(spaceId);

      const fileRepository = new MongoFileRepository(spaceRepository);

      const filesOfType = await fileRepository.find(100000, null, { typeEquals: fileTypeId });

      if (filesOfType.results.length === 0) {
        const deletedItem = await spaceEntity.deleteType(user, fileTypeId);
        res.json(deletedItem);
      } else {
        throw new InvalidOperationError(`There are uploaded files of this File Type`);
      }
    } catch (err) {
      const errMessage = `Failed deleting type: ${err.message}`;
      logger.error(errMessage);
      res.statusMessage = errMessage;
      res.status(400);
      next(res);
    }
  });

  return fileTypeRouter;
};
