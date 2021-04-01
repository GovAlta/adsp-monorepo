import { Logger } from 'winston';
import { Router } from 'express';
import {
  assertAuthenticatedHandler,
  User,
  UnauthorizedError,
  NotFoundError,
  DomainEventService,
} from '@core-services/core-common';
import { FileSpaceRepository, FileRepository } from '../repository';
import { createdFileType, updatedFileType } from '../event';

interface AdminRouterProps {
  logger: Logger;
  rootStoragePath: string;
  eventService: DomainEventService;
  spaceRepository: FileSpaceRepository;
  fileRepository: FileRepository;
}

export const createAdminRouter = ({
  logger,
  rootStoragePath,
  eventService,
  spaceRepository,
  fileRepository,
}: AdminRouterProps) => {
  const adminRouter = Router();

  /**
   * @swagger
   *
   * /file-admin/v1/{space}/types:
   *   get:
   *     tags:
   *     - File Administration
   *     description: Retrieves file types.
   *     parameters:
   *     - name: space
   *       description: ID of the space to retrieve types from.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: File types successfully retrieved.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 page:
   *                   type: object
   *                   properties:
   *                     size:
   *                       type: number
   *                     after:
   *                       type: string
   *                     next:
   *                       type: string
   *                 results:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       anonymousRead:
   *                         type: boolean
   *                       readRoles:
   *                         type: array
   *                         items:
   *                           type: string
   *                       updateRoles:
   *                         type: array
   *                         items:
   *                           type: string
   */
  adminRouter.get('/:space/types', assertAuthenticatedHandler, async (req, res, next) => {
    const user = req.user as User;
    const { space } = req.params;

    try {
      const spaceEntity = await spaceRepository.get(space);

      if (!spaceEntity) {
        throw new NotFoundError('Space', space);
      } else if (!spaceEntity.canAccess(user)) {
        throw new UnauthorizedError('User not authorized to access space.');
      }

      res.json(
        Object.entries(spaceEntity.types).reduce((result, [id, type]) => {
          result[id] = {
            id: type.id,
            name: type.name,
            anonymousRead: type.anonymousRead,
            readRoles: type.readRoles,
            updateRoles: type.updateRoles,
          };
          return result;
        }, {})
      );
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   *
   * /file-admin/v1/{space}/types/{type}:
   *   put:
   *     tags:
   *     - File Administration
   *     description: Creates or updates a file type.
   *     parameters:
   *     - name: space
   *       description: ID of the space of the type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: type
   *       description: ID of the type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               anonymousRead:
   *                 type: boolean
   *               readRoles:
   *                 type: array
   *                 items:
   *                   type: string
   *               updateRoles:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Space successfully created or updated.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 name:
   *                   type: string
   *                 anonymousRead:
   *                   type: boolean
   *                 readRoles:
   *                   type: array
   *                   items:
   *                     type: string
   *                 updateRoles:
   *                   type: array
   *                   items:
   *                     type: string
   *       401:
   *         description: User not authorized to update file type.
   *       404:
   *         description: Space not found.
   */
  adminRouter.put('/:space/types/:type', assertAuthenticatedHandler, async (req, res, next) => {
    const user = req.user as User;
    const { space, type } = req.params;
    const { name, anonymousRead, readRoles, updateRoles } = req.body;

    try {
      const spaceEntity = await spaceRepository.get(space);

      if (!spaceEntity) {
        throw new NotFoundError('Space', space);
      } else if (!spaceEntity.canAccess(user)) {
        throw new UnauthorizedError('User not authorized to access space.');
      }

      const fileType = spaceEntity.types[type];

      if (!fileType) {
        const entity = await spaceEntity.addType(user, rootStoragePath, type, {
          name,
          anonymousRead,
          readRoles,
          updateRoles,
        });

        const typeEntity = entity.types[type];
        eventService.send(
          createdFileType(
            space,
            {
              id: typeEntity.id,
              name: typeEntity.name,
              anonymousRead: typeEntity.anonymousRead,
              readRoles: typeEntity.readRoles,
              updateRoles: typeEntity.updateRoles,
            },
            user,
            new Date()
          )
        );
      } else {
        const entity = await spaceEntity.updateType(user, type, {
          name,
          anonymousRead,
          readRoles,
          updateRoles,
        });

        const typeEntity = entity.types[type];
        eventService.send(
          updatedFileType(
            space,
            {
              id: typeEntity.id,
              name: typeEntity.name,
              anonymousRead: typeEntity.anonymousRead,
              readRoles: typeEntity.readRoles,
              updateRoles: typeEntity.updateRoles,
            },
            user,
            new Date()
          )
        );
      }

      logger.info(
        `File type ${fileType.name} (ID: ${fileType.id}) in ` +
          `space ${spaceEntity.id} (ID: ${spaceEntity.id}) updated by ` +
          `user ${user.name} (ID: ${user.id}).`
      );

      res.json({
        id: fileType.id,
        name: fileType.name,
        anonymousRead: fileType.anonymousRead,
        readRoles: fileType.readRoles,
        updateRoles: fileType.updateRoles,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * @swagger
   *
   * /file-admin/v1/{space}/types/{type}/files:
   *   get:
   *     tags:
   *     - File Administration
   *     description: Retrieves files of a type.
   *     parameters:
   *     - name: space
   *       description: Space to retrieve files from.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: type
   *       description: Type of files to retrieve.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: top
   *       description: Number of results to retrieve.
   *       in: query
   *       required: false
   *       schema:
   *         type: number
   *     - name: after
   *       description: Cursor to continue a previous request.
   *       in: query
   *       required: false
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Files successfully retrieved.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 page:
   *                   type: object
   *                   properties:
   *                     size:
   *                       type: number
   *                     after:
   *                       type: string
   *                     next:
   *                       type: string
   *                 results:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       filename:
   *                         type: string
   *                       size:
   *                         type: number
   *                       createdBy:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           name:
   *                             type: string
   *                       created:
   *                         type: string
   *                         format: date
   *                       lastAccessed:
   *                         type: string
   *                         format: date
   *                       scanned:
   *                         type: boolean
   *                       deleted:
   *                         type: boolean
   */
  adminRouter.get('/:space/types/:type/files', assertAuthenticatedHandler, async (req, res, next) => {
    const user = req.user as User;
    const { space, type } = req.params;
    const { top, after } = req.query;

    try {
      const results = await fileRepository.find(parseInt((top as string) || '10', 10), after as string, {
        spaceEquals: space,
        typeEquals: type,
      });

      res.json({
        page: results.page,
        results: results.results
          .filter((result) => result.canAccess(user))
          .map((result) => ({
            id: result.id,
            filename: result.filename,
            size: result.size,
            created: result.created,
            createdBy: result.createdBy,
            lastAccessed: result.lastAccessed,
            scanned: result.scanned,
            deleted: result.deleted,
          })),
      });
    } catch (err) {
      next(err);
    }
  });

  return adminRouter;
};
