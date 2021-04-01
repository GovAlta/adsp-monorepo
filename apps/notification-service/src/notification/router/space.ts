import { Logger } from 'winston';
import { Router } from 'express';
import { assertAuthenticatedHandler, User, UnauthorizedError, NotFoundError } from '@core-services/core-common';
import { NotificationSpaceRepository } from '../repository';
import { NotificationSpaceEntity } from '../model';
import { mapSpace } from './mappers';

interface SpaceRouterProps {
  logger: Logger;
  spaceRepository: NotificationSpaceRepository;
}

export const createSpaceRouter = ({ logger, spaceRepository }: SpaceRouterProps) => {
  const spaceRouter = Router();

  /**
   * @swagger
   *
   * /space/v1/spaces:
   *   get:
   *     tags:
   *     - Notification Space
   *     description: Retrieves notification spaces.
   *     parameters:
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
   *         description: Notification spaces succesfully retrieved.
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
   *                       spaceAdminRole:
   *                         type: string
   */
  spaceRouter.get('/spaces', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { top, after } = req.query;

    spaceRepository
      .find(parseInt((top as string) || '10', 10), after as string)
      .then((spaces) => {
        res.send({
          page: spaces.page,
          results: spaces.results.filter((n) => n.canAccess(user)).map(mapSpace),
        });
      })
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /space/v1/spaces/{space}:
   *   get:
   *     tags:
   *     - Notification Space
   *     description: Retrieves a specified notification space.
   *     parameters:
   *     - name: space
   *       description: ID of the space to retrieve.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Space successfully retrieved.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 name:
   *                   type: string
   *                 spaceAdminRole:
   *                   type: string
   *       401:
   *         description: User not authorized to access notification space.
   *       404:
   *         description: Notification space not found.
   */
  spaceRouter.get('/spaces/:space', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { space } = req.params;

    spaceRepository
      .get(space)
      .then((spaceEntity) => {
        if (!spaceEntity) {
          throw new NotFoundError('Space', space);
        } else if (!spaceEntity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access space.');
        } else {
          res.json(mapSpace(spaceEntity));
        }
      })
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /space/v1/spaces/{space}:
   *   put:
   *     tags:
   *     - Notification Space
   *     description: Creates or updates a notification space.
   *     parameters:
   *     - name: space
   *       description: ID of the space to create or update.
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
   *               spaceAdminRole:
   *                 type: string
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
   *                 spaceAdminRole:
   *                   type: string
   *       401:
   *         description: User not authorized to update notification space.
   */
  spaceRouter.put('/spaces/:space', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { space } = req.params;

    spaceRepository
      .get(space)
      .then((spaceEntity) => {
        if (!spaceEntity) {
          return NotificationSpaceEntity.create(user, spaceRepository, { ...req.body, id: space });
        } else {
          return spaceEntity.update(user, req.body);
        }
      })
      .then((spaceEntity) => {
        res.send(mapSpace(spaceEntity));
        return spaceEntity;
      })
      .then((spaceEntity) => {
        logger.info(`Space ${spaceEntity.name} (ID: ${space}) updated by ` + `user ${user.name} (ID: ${user.id}).`);
        return spaceEntity;
      })
      .catch((err) => next(err));
  });

  return spaceRouter;
};
