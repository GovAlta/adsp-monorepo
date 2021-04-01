import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError, User } from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { EventRepository } from '../repository';
import { mapEventDefinition } from './mappers';

interface AdministrationRouterProps {
  logger: Logger;
  eventRepository: EventRepository;
}

export const createAdministrationRouter = ({ logger, eventRepository }: AdministrationRouterProps): Router => {
  const administrationRouter = Router();

  /**
   * @swagger
   *
   * /event-admin/v1/{namespace}/definitions:
   *   get:
   *     tags:
   *     - Event Administration
   *     description: Retrieves event definitions in a namespace.
   *     parameters:
   *     - name: namespace
   *       description: Namespace to get the definitions from.
   *       in: path
   *       required: true
   *       schema:
   *         type: number
   *     responses:
   *       200:
   *         description: Event definitions succesfully retrieved.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   namespace:
   *                     type: string
   *                   name:
   *                     type: string
   *                   description:
   *                     type: string
   *                   payloadSchema:
   *                     type: object
   *                   sendRoles:
   *                     type: array
   *                     items:
   *                       type: string
   */
  administrationRouter.get('/:namespace/definitions', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { namespace } = req.params;
    eventRepository
      .getNamespace(namespace)
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('Event Namespace', namespace);
        } else if (!entity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access event namespace.');
        }
        return entity;
      })
      .then((entity) =>
        res.send(
          Object.entries(entity.definitions).map(([_key, definition]) => mapEventDefinition(namespace, definition))
        )
      )
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /event-admin/v1/{namespace}/definitions/{definition}:
   *   get:
   *     tags:
   *     - Event Administration
   *     description: Retrieves an event definitions in a namespace.
   *     parameters:
   *     - name: namespace
   *       description: Namespace to retrieve the definition from.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: definition
   *       description: Definition to retrieve.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       '200':
   *         description: Retrieved event definition.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   namespace:
   *                     type: string
   *                   name:
   *                     type: string
   *                   description:
   *                     type: string
   *                   payloadSchema:
   *                     type: object
   *                   sendRoles:
   *                     type: array
   *                     items:
   *                       type: string
   */
  administrationRouter.get('/:namespace/definitions/:name', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { namespace, name } = req.params;
    eventRepository
      .getNamespace(namespace)
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('Event Namespace', namespace);
        } else if (!entity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access event namespace.');
        }
        return entity;
      })
      .then((entity) => {
        const definition = entity.definitions[name];
        if (!definition) {
          throw new NotFoundError('Event Definition', `${namespace}:${name}`);
        }
        return definition;
      })
      .then((definition) => res.send(mapEventDefinition(namespace, definition)))
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /event-admin/v1/{namespace}/definitions/{definition}:
   *   put:
   *     tags:
   *     - Event Administration
   *     description: Creates or updates an event definitions in a namespace.
   *     parameters:
   *     - name: namespace
   *       description: Namespace to update the definition in.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: definition
   *       description: Definition to update.
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
   *               description:
   *                 type: string
   *               payloadSchema:
   *                 type: object
   *               sendRoles:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       '200':
   *         description: Event definition successfully updated.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   namespace:
   *                     type: string
   *                   name:
   *                     type: string
   *                   description:
   *                     type: string
   *                   payloadSchema:
   *                     type: object
   *                   sendRoles:
   *                     type: array
   *                     items:
   *                       type: string
   */
  administrationRouter.put('/:namespace/definitions/:name', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const namespace = req.params.namespace;
    const name = req.params.name;
    eventRepository
      .getNamespace(namespace)
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('Namespace', namespace);
        }
        return entity;
      })
      .then((entity) =>
        entity.definitions[name]
          ? entity.updateDefinition(user, name, req.body)
          : entity.addDefinition(user, { ...req.body, name, namespace })
      )
      .then((entity) => res.send(mapEventDefinition(namespace, entity)))
      .then(() => logger.info(`Event definition ${namespace}:${name} updated by user ${user.name} (ID: ${user.id}).`))
      .catch((err) => next(err));
  });

  /**
   * @swagger
   *
   * /event-admin/v1/{namespace}/definitions/{definition}:
   *   delete:
   *     tags:
   *     - Event Administration
   *     description: Deletes an event definitions in a namespace.
   *     parameters:
   *     - name: namespace
   *       description: Namespace to delete the definition from.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: definition
   *       description: Definition to delete.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       '200':
   *         description: Event definition successfully deleted.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 deleted:
   *                   type: boolean
   */
  administrationRouter.delete('/:namespace/definitions/:name', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const namespace = req.params.namespace;
    const name = req.params.name;
    eventRepository
      .getNamespace(namespace)
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('Namespace', namespace);
        }
        return entity;
      })
      .then((entity) => entity.removeDefinition(user, name))
      .then((deleted) => res.send({ deleted }))
      .then(() => logger.info(`Event definition ${namespace}:${name} deleted by user ${user.name} (ID: ${user.id}).`))
      .catch((err) => next(err));
  });

  return administrationRouter;
};
