import { Logger } from 'winston';
import { Router } from 'express';
import { 
  assertAuthenticatedHandler, 
  User, 
  UnauthorizedError, 
  NotFoundError 
} from '@core-services/core-common';
import { PushSpaceRepository } from '../repository';
import { PushSpaceEntity } from '../model';

interface SpaceRouterProps {
  logger: Logger
  spaceRepository: PushSpaceRepository
}

const mapSpace = (entity: PushSpaceEntity) => ({
  id: entity.id,
  adminRole: entity.adminRole
})

export const createSpaceRouter = ({
  logger,
  spaceRepository
}: SpaceRouterProps) => {

  const spaceRouter = Router();

  /**
   * @swagger
   *
   * /space/v1/spaces:
   *   get:
   *     tags: 
   *     - Push Space
   *     description: Retrieves push spaces.
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
   *         description: Push spaces succesfully retrieved.
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
   *                       adminRole:
   *                         type: string
   */
  spaceRouter.get(
    '/spaces', 
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user = req.user as User;
      const { top, after } = req.query;

      spaceRepository.find(
        parseInt((top as string) || '10', 10), 
        after as string
      ).then((spaces) => {
        res.send({
          page: spaces.page,
          results: spaces.results.filter(
            n => n.canAccess(user)
          ).map(mapSpace)
        })
      }).catch((err) => next(err));
    }
  );


  /**
   * @swagger
   *
   * /space/v1/spaces/{space}:
   *   get:
   *     tags: 
   *     - Push Space
   *     description: Retrieves a specified push space.
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
   *         description: User not authorized to access push space.
   *       404:
   *         description: Push space not found.
   */
  spaceRouter.get(
    '/spaces/:space', 
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user = req.user as User;
      const { space } = req.params;

      spaceRepository.get(
        space
      ).then((spaceEntity) => {
        
        if (!spaceEntity) {
          throw new NotFoundError('Space', space);
        }
        else if (!spaceEntity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access space.');
        } else {
          res.json(mapSpace(spaceEntity));
        }
      }).catch((err) => next(err));
    }
  );

  /**
   * @swagger
   *
   * /space/v1/spaces/{space}:
   *   put:
   *     tags: 
   *     - Push Space
   *     description: Creates or updates a push space.
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
   *               adminRole:
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
   *                 adminRole:
   *                   type: string
   *       401:
   *         description: User not authorized to update push space.
   */
  spaceRouter.put(
    '/spaces/:space', 
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user = req.user as User;
      const { space } = req.params;

      spaceRepository.get(
        space
      ).then((spaceEntity) => {
        if (!spaceEntity) {
          return PushSpaceEntity.create(
            user, 
            spaceRepository, 
            { ...req.body, id: space }
          ) ;
        } else {
          return spaceEntity.update(
            user, 
            req.body
          );
        }
      })
      .then((spaceEntity) => {
        res.send(mapSpace(spaceEntity));
        return spaceEntity;
      })
      .then((spaceEntity) => 
        logger.info(
          `Space ${spaceEntity.name} (ID: ${space}) updated by ` + 
          `user ${user.name} (ID: ${user.id}).`
        )
      )
      .catch(err => next(err));
    }
  );

  return spaceRouter;
}
