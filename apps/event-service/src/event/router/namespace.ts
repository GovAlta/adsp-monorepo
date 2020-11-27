import { Router } from 'express';
import { User, assertAuthenticatedHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { EventRepository } from '../repository';
import { NamespaceEntity } from '../model';
import { mapNamespace } from './mappers';
import { Logger } from 'winston';

interface NamespaceRouterProps {
  logger: Logger
  eventRepository: EventRepository
}

export const createNamespaceRouter = ({
  logger,
  eventRepository
}: NamespaceRouterProps): Router => {

  const namespaceRouter = Router();

  /**
   * @swagger
   *
   * /namespace/v1/namespaces:
   *   get:
   *     tags: 
   *     - Event Namespace
   *     description: Retrieves event namespaces.
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
   *         description: event namespaces succesfully retrieved.
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
   *                       name:
   *                         type: string
   *                       description: 
   *                         type: string
   *                       adminRole:
   *                         type: string
   */
  namespaceRouter.get(
    '/namespaces',
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user: User = req.user as User;
      const top: number = parseInt(req.query.top as string || '10', 10);
      const after: string = req.query.after as string;
      eventRepository.getNamespaces(
        top, after
      ).then((result) => res.json({
        results: result.results
          .filter(r => r.canAccess(user))
          .map(mapNamespace),
        page: result.page
      })).catch((err) => 
        next(err)
      );
    }
  )
  
  /**
   * @swagger
   *
   * /namespace/v1/namespaces/{namespace}:
   *   get:
   *     tags: 
   *     - Event Namespace
   *     description: Retrieves a specified event namespace.
   *     parameters:
   *     - name: namespace
   *       description: Name of the event namespace to retrieve.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: event namespace successfully retrieved.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 name:
   *                   type: string
   *                 description: 
   *                   type: string
   *                 adminRole:
   *                   type: string
   *       401:
   *         description: User not authorized to access namespace.
   *       404:
   *         description: Namespace not found.
   */
  namespaceRouter.get(
    '/namespaces/:namespace',
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user: User = req.user as User;
      const name: string = req.params.namespace;
      eventRepository.getNamespace(name)
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('Event Namespace', name);
        } else if (!entity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access event namespace.');
        }
        return entity;
      })
      .then(
        (entity) => entity ? 
          res.json(mapNamespace(entity)) : 
          res.sendStatus(404)
      )
      .catch((err) => next(err));
    }
  );

  /**
   * @swagger
   *
   * /namespace/v1/namespaces/{namespace}:
   *   put:
   *     tags: 
   *     - Event Namespace
   *     description: Create or udpates an event namespace.
   *     parameters:
   *     - name: namespace
   *       description: Name of the event namespace to update.
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
   *               adminRole:
   *                 type: string
   *     responses:
   *       200:
   *         description: Namespace successfully updated.
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
   *         description: User not authorized to update event namespace.
   */
  namespaceRouter.put(
    '/namespaces/:namespace', 
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user: User = req.user as User;
      const name: string = req.params.namespace;
      const update = {
        name,
        description: req.body.description,
        adminRole: req.body.adminRole
      }

      eventRepository.getNamespace(name)
      .then(
        (entity) => entity ?
          entity.update(user, update) :
          NamespaceEntity.create(user, eventRepository, update)
      )
      .then((entity) => 
        res.json(mapNamespace(entity))
      )
      .then(() => 
        logger.info(
          `Event namespace ${name} updated by user ${user.name} (ID: ${user.id}).`
        )
      )
      .catch((err) => next(err));
    }
  );

  return namespaceRouter;
}
