import type { Logger } from 'winston';
import { RequestHandler, Router } from 'express';
import {
  assertAuthenticatedHandler,
  User,
  UnauthorizedError,
  NotFoundError,
  DomainEventService,
} from '@core-services/core-common';
import { FileSpaceRepository, FileRepository } from '../repository';
import { createdFileType, updatedFileType } from '../event';

import { AuthenticationConfig, authenticateToken } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';

interface AdminRouterProps {
  logger: Logger;
  rootStoragePath: string;
  eventService: DomainEventService;
  spaceRepository: FileSpaceRepository;
  fileRepository: FileRepository;
}

export const adminOnlyMiddleware: RequestHandler = async (req, res, next: () => void) => {
  const authConfig: AuthenticationConfig = {
    requireCore: true,
    allowedRoles: ['file-service-admin'],
  };

  if (authenticateToken(authConfig, req.user)) {
    next();
  } else {
    res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
  }
};

export const createAdminRouter = ({
  logger,
  rootStoragePath,
  eventService,
  spaceRepository,
  fileRepository,
}: AdminRouterProps): Router => {
  const adminRouter = Router();

  adminRouter.get('/:space/types', [adminOnlyMiddleware, assertAuthenticatedHandler], async (req, res, next) => {
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

  adminRouter.get('/spaces', [adminOnlyMiddleware, assertAuthenticatedHandler], async (req, res, next) => {
    const user = req.user as User;
    const { top, after } = req.query;

    try {
      const spaces = await spaceRepository.find(parseInt((top as string) || '50', 50), after as string);
      res.send({
        page: spaces.page,
        results: spaces.results
          .filter((n) => n.canAccess(user))
          .map((n) => ({
            id: n.id,
            name: n.name,
            spaceAdminRole: n.spaceAdminRole,
          })),
      });
    } catch (err) {
      next(err);
    }
  });

  adminRouter.put('/:space/types/:type', [adminOnlyMiddleware, assertAuthenticatedHandler], async (req, res, next) => {
    const user = req.user as User;
    const { space, type } = req.params;
    const { name, anonymousRead, readRoles, updateRoles, spaceId } = req.body;

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
          spaceId,
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
              spaceId: typeEntity.spaceId,
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
          spaceId,
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
              spaceId: typeEntity.spaceId,
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
        spaceId: fileType.spaceId,
      });
    } catch (err) {
      next(err);
    }
  });

  adminRouter.get(
    '/:space/types/:type/files',
    [adminOnlyMiddleware, assertAuthenticatedHandler],
    async (req, res, next) => {
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
    }
  );

  return adminRouter;
};
