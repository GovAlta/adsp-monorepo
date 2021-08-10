import type { Logger } from 'winston';
import { Router } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import {
  AuthenticationConfig,
  authenticateToken,
  UnauthorizedError,
  NotFoundError,
  AuthAssert,
} from '@core-services/core-common';
import { FileSpaceRepository, FileRepository } from '../repository';

interface AdminRouterProps {
  logger: Logger;
  rootStoragePath: string;
  spaceRepository: FileSpaceRepository;
  fileRepository: FileRepository;
}

export const AdminAssert = {
  adminOnlyMiddleware: function (req, res, next: () => void) {
    const authConfig: AuthenticationConfig = {
      requireCore: true,
      allowedRoles: ['file-service-admin'],
    };

    if (authenticateToken(authConfig, req.user)) {
      next();
    } else {
      res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
    }
  },
};

export const createAdminRouter = ({
  logger,
  rootStoragePath,
  spaceRepository,
  fileRepository,
}: AdminRouterProps): Router => {
  const adminRouter = Router();

  adminRouter.get('/:space/types', AdminAssert.adminOnlyMiddleware, AuthAssert.assertMethod, async (req, res, next) => {
    const user = req.user;
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

  adminRouter.get('/spaces', AdminAssert.adminOnlyMiddleware, AuthAssert.assertMethod, async (req, res, next) => {
    const user = req.user;
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

  adminRouter.put(
    '/:space/types/:type',
    AdminAssert.adminOnlyMiddleware,
    AuthAssert.assertMethod,
    async (req, res, next) => {
      const user = req.user;
      const { space, type } = req.params;
      const { name, anonymousRead, readRoles, updateRoles, spaceId } = req.body;

      try {
        const spaceEntity = await spaceRepository.get(space);

        if (!spaceEntity) {
          throw new NotFoundError('Space', space);
        } else if (!spaceEntity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access space.');
        }

        let fileType = spaceEntity.types[type];

        if (!fileType) {
          await spaceEntity.addType(user, rootStoragePath, type, {
            name,
            anonymousRead,
            readRoles,
            updateRoles,
            spaceId,
          });
        } else {
          await spaceEntity.updateType(user, type, {
            name,
            anonymousRead,
            readRoles,
            updateRoles,
            spaceId,
          });
        }

        fileType = spaceEntity.types[type];

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
    }
  );

  adminRouter.get(
    '/:space/types/:type/files',
    AdminAssert.adminOnlyMiddleware,
    AuthAssert.assertMethod,
    async (req, res, next) => {
      const user = req.user;
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
