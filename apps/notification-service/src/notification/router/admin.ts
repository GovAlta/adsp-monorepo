import { Router } from 'express';
import { Logger } from 'winston';
import type { User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import { NotificationSpaceRepository, NotificationTypeRepository } from '../repository';
import { NotificationSpaceEntity, NotificationTypeEntity } from '../model';
import { mapType } from './mappers';

interface NotificationAdminRouterProps {
  logger: Logger;
  spaceRepository: NotificationSpaceRepository;
  typeRepository: NotificationTypeRepository;
}

export const createAdminRouter = ({ logger, spaceRepository, typeRepository }: NotificationAdminRouterProps) => {
  const notificationRouter = Router();

  /**
   * @swagger
   *
   * /notification-admin/v1/{space}/types:
   *   get:
   *     tags:
   *     - Notification Administration
   *     description: Retrieves notification types in a notification space.
   *     parameters:
   *     - name: space
   *       description: Notification space to get the types from.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Notification types successfully retrieved.
   */
  notificationRouter.get('/:space/types', assertAuthenticatedHandler, (req, res, next) => {
    const { space } = req.params;
    const top = req.query.top ? parseInt(req.query.top as string, 10) : 10;
    const after = req.query.after as string;

    typeRepository
      .find(top, after, { spaceIdEquals: space })
      .then((result) =>
        res.send({
          results: result.results.map(mapType),
          page: result.page,
        })
      )
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /notification-admin/v1/{space}/types/{type}:
   *   get:
   *     tags:
   *     - Notification Administration
   *     description: Retrieves notification type in a notification space.
   *     parameters:
   *     - name: space
   *       description: Notification space of the type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: type
   *       description: Type to retrieve.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Notification type successfully retrieved.
   */
  notificationRouter.get('/:space/types/:type', assertAuthenticatedHandler, (req, res, next) => {
    const { space, type } = req.params;

    spaceRepository
      .get(space)
      .then((spaceEntity) => typeRepository.get(spaceEntity, type))
      .then((type) => res.send(mapType(type)))
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /notification-admin/v1/{space}/types/{type}:
   *   put:
   *     tags:
   *     - Notification Administration
   *     description: Create or update notification type in a notification space.
   *     parameters:
   *     - name: space
   *       description: Notification space of the type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: type
   *       description: Type to create or update.
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
   *               description:
   *                 type: string
   *               publicSubscribe:
   *                 type: boolean
   *               subscriberRoles:
   *                 type: array
   *                 items:
   *                   type: string
   *               events:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     namespace:
   *                       type: string
   *                     name:
   *                       type: string
   *                     channels:
   *                       type: array
   *                       items:
   *                         type: string
   *                         enum: [email, sms, mail]
   *                     templates:
   *                       type: object
   *                       items:
   *                         type: object
   *                         properties:
   *                           email:
   *                             type: object
   *                             properties:
   *                               subject:
   *                                 type: string
   *                               body:
   *                                 type: string
   *                           sms:
   *                             type: object
   *                             properties:
   *                               subject:
   *                                 type: string
   *                               body:
   *                                 type: string
   *                           mail:
   *                             type: object
   *                             properties:
   *                               subject:
   *                                 type: string
   *                               body:
   *                                 type: string
   *     responses:
   *       200:
   *         description: Notification type successfully updated.
   */
  notificationRouter.put('/:space/types/:type', assertAuthenticatedHandler, (req, res, next) => {
    const { space, type } = req.params;
    const user = req.user as User;

    spaceRepository
      .get(space)
      .then((spaceEntity) => typeRepository.get(spaceEntity, type).then((typeEntity) => [spaceEntity, typeEntity]))
      .then(([spaceEntity, typeEntity]: [NotificationSpaceEntity, NotificationTypeEntity]) =>
        typeEntity
          ? typeEntity.update(user, req.body)
          : NotificationTypeEntity.create(user, typeRepository, spaceEntity, type, req.body)
      )
      .then((typeEntity) => {
        logger.info(
          `Notification type ${typeEntity.name} (ID: ${typeEntity.id}) updated by ` +
            `user ${user.name} (ID: ${user.id}).`
        );
        return typeEntity;
      })
      .then((typeEntity) => res.send(mapType(typeEntity)))
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /notification-admin/v1/{space}/types/{type}:
   *   delete:
   *     tags:
   *     - Notification Administration
   *     description: Deletes a notification type in a notification space.
   *     parameters:
   *     - name: space
   *       description: Notification space of the type.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: type
   *       description: Type to delete.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Notification type deleted.
   */
  notificationRouter.delete('/:space/types/:type', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { space, type } = req.params;

    return spaceRepository
      .get(space)
      .then((spaceEntity) => typeRepository.get(spaceEntity, type))
      .then((typeEntity) => typeEntity.delete(user).then((result) => [typeEntity, result]))
      .then(([typeEntity, result]: [NotificationTypeEntity, boolean]) => {
        if (result) {
          logger.info(
            `Notification type ${typeEntity.name} (ID: ${typeEntity.id}) deleted by ` +
              `user ${user.name} (ID: ${user.id}).`
          );
        }
        return result;
      })
      .then((result) => res.send(result))
      .catch((err) => next(err));
  });

  return notificationRouter;
};
