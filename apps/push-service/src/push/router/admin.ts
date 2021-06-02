import type { User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { PushSpaceEntity, StreamEntity } from '../model';
import { PushSpaceRepository, StreamRepository } from '../repository';

interface AdminRouterProps {
  logger: Logger;
  spaceRepository: PushSpaceRepository;
  streamRepository: StreamRepository;
}

const mapStream = (entity: StreamEntity) => ({
  spaceId: entity.spaceId,
  id: entity.id,
  name: entity.name,
  subscriberRoles: entity.subscriberRoles,
  events: entity.events,
});

export const createAdminRouter = ({ logger, spaceRepository, streamRepository }: AdminRouterProps) => {
  const adminRouter = Router();

  adminRouter.get('/:space/streams', assertAuthenticatedHandler, (req, res, next) => {
    res.sendStatus(404);
  });

  adminRouter.get('/:space/streams/:stream', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { space, stream } = req.params;
    streamRepository
      .get({ spaceId: space, id: stream })
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('push space', space);
        } else if (!entity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access namespace');
        }
        return entity;
      })
      .then((entity) => res.json(mapStream(entity)))
      .catch((err) => next(err));
  });

  adminRouter.put('/:space/streams/:stream', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { space, stream } = req.params;
    const update = req.body;
    spaceRepository
      .get(space)
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('push space', space);
        }
        return entity;
      })
      .then((spaceEntity) =>
        streamRepository.get({ spaceId: space, id: stream }).then((streamEntity) => [spaceEntity, streamEntity])
      )
      .then(([spaceEntity, streamEntity]: [PushSpaceEntity, StreamEntity]) =>
        streamEntity
          ? streamEntity.update(user, update)
          : StreamEntity.create(streamRepository, spaceEntity, stream, update)
      )
      .then((entity) => {
        res.json(mapStream(entity));
        return entity;
      })
      .then((entity) =>
        logger.info(`Space ${entity.name} (ID: ${space}) updated by ` + `user ${user.name} (ID: ${user.id}).`)
      )
      .catch((err) => next(err));
  });

  adminRouter.delete('/:space/streams/:stream', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { space, stream } = req.params;
    streamRepository
      .get({ spaceId: space, id: stream })
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('stream', `${space}:${stream}`);
        }
        return entity;
      })
      .then((entity) => entity.delete(user))
      .then((result) => res.send({ deleted: result }))
      .catch((err) => next(err));
  });

  return adminRouter;
};
