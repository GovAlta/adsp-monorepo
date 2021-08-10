import { Logger } from 'winston';
import { Router } from 'express';
import { UnauthorizedError, NotFoundError, AuthAssert } from '@core-services/core-common';
import { FileSpaceRepository } from '../repository';
import { FileSpaceEntity } from '../model';
import { v4 as uuidv4 } from 'uuid';

interface SpaceRouterProps {
  logger: Logger;
  spaceRepository: FileSpaceRepository;
}

export const createSpaceRouter = ({ logger, spaceRepository }: SpaceRouterProps): Router => {
  const spaceRouter = Router();

  spaceRouter.get('/spaces', AuthAssert.assertMethod, async (req, res, next) => {
    const user = req.user;

    try {
      const spaceId = await spaceRepository.getIdByTenant(req.tenant);
      if (!spaceId) {
        throw new NotFoundError('Space', `${user.tenantId}`);
      }
      const spaceEntity = await spaceRepository.get(spaceId);

      if (!spaceEntity.canAccess(user)) {
        throw new UnauthorizedError('User not authorized to access space.');
      } else {
        res.json({
          id: spaceEntity.id,
          name: spaceEntity.name,
          spaceAdminRole: spaceEntity.spaceAdminRole,
        });
      }
    } catch (err) {
      next(err);
    }
  });

  spaceRouter.post('/spaces', AuthAssert.assertMethod, async (req, res, next) => {
    const user = req.user;
    const { spaceAdminRole } = req.body;

    try {
      const spaceId = await spaceRepository.getIdByTenant(req.tenant);
      if (!spaceId) {
        const entity = await FileSpaceEntity.create(user, spaceRepository, {
          id: uuidv4(),
          spaceAdminRole,
          name: req.tenant.name,
        });

        logger.info(`Space ${entity.name} (ID: ${entity.id}) created by ` + `user ${user.name} (ID: ${user.id}).`);

        res.send({
          id: entity.id,
          name: entity.name,
          spaceAdminRole: entity.spaceAdminRole,
        });
      } else {
        const spaceEntity = await spaceRepository.get(spaceId);

        await spaceEntity.update(user, {
          spaceAdminRole,
        });

        logger.info(
          `Space ${spaceEntity.name} (ID: ${spaceEntity.id}) updated by ` + `user ${user.name} (ID: ${user.id}).`
        );

        res.send({
          id: spaceEntity.id,
          name: spaceEntity.name,
          spaceAdminRole: spaceEntity.spaceAdminRole,
        });
      }
    } catch (err) {
      next(err);
    }
  });

  return spaceRouter;
};
