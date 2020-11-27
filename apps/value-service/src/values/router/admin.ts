import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError, User } from '@core-services/core-common';
import { Router } from 'express';
import { ValuesRepository } from '../repository';
import { mapValueDefinition } from './mappers';

interface AdministrationRouterProps {
  valueRepository: ValuesRepository
}

export const createAdministrationRouter = ({
  valueRepository
}: AdministrationRouterProps): Router => {

  const administrationRouter = Router();

  /**
   * @swagger
   *
   * /value-admin/v1/{namespace}/definitions:
   *   get:
   *     tags:
   *     - Value Administration
   *     description: Retrieves value definitions in a namespace.
   *     parameters:
   *     - name: namespace
   *       description: Namespace to get the definitions from.
   *       in: path
   *       required: true
   *       schema:
   *         type: number
   *     responses:
   *       200:
   *         description: Value definitions succesfully retrieved.
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
   *                   type:
   *                     type: string
   *                   jsonSchema:
   *                     type: object
   *                   readRoles:
   *                     type: array
   *                     items:
   *                       type: string
   *                   writeRoles:
   *                     type: array
   *                     items:
   *                       type: string
   */
  administrationRouter.get(
    '/:namespace/definitions',
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user = req.user as User;
      const namespace = req.params.namespace;
      
      valueRepository.getNamespace(namespace)
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('Value Namespace', namespace);
        } else if (!entity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access namespace.');
        }
        return entity;
      })
      .then((entity) =>
        res.send(
          Object.entries(entity.definitions)
          .map(([_,definition]) =>
            mapValueDefinition(namespace, definition)
          )
        )
      )
      .catch(err => next(err));
    }
  );

  /**
   * @swagger
   *
   * /value-admin/v1/{namespace}/definitions:
   *   post:
   *     tags:
   *     - Value Administration
   *     description: Creates a new value definitions in a namespace.
   *     parameters:
   *     - name: namespace
   *       description: Namespace to create the definition in.
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
   *               type:
   *                 type: string
   *               jsonSchema:
   *                 type: object
   *               readRoles:
   *                 type: array
   *                 items:
   *                   type: string
   *               writeRoles:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       '200':
   *         description: Value definition successfully created.
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
   *                   type:
   *                     type: string
   *                   jsonSchema:
   *                     type: object
   *                   readRoles:
   *                     type: array
   *                     items:
   *                       type: string
   *                   writeRoles:
   *                     type: array
   *                     items:
   *                       type: string
   */
  administrationRouter.post(
    '/:namespace/definitions',
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user = req.user as User;
      const namespace = req.params.namespace;
      valueRepository.getNamespace(namespace)
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('Value Namespace', namespace);
        } else if (!entity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access namespace.');
        }
        return entity;
      })
      .then((entity) =>
        entity.addDefinition(user, req.body)
      )
      .then((entity) =>
        res.send(mapValueDefinition(namespace, entity))
      )
      .catch(err => next(err));
    }
  );

  /**
   * @swagger
   *
   * /value-admin/v1/{namespace}/definitions/{definition}:
   *   post:
   *     tags:
   *     - Value Administration
   *     description: Updates a value definitions in a namespace.
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
   *               type:
   *                 type: string
   *               jsonSchema:
   *                 type: object
   *               readRoles:
   *                 type: array
   *                 items:
   *                   type: string
   *               writeRoles:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       '200':
   *         description: Value definition successfully updated.
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
   *                   type:
   *                     type: string
   *                   jsonSchema:
   *                     type: object
   *                   readRoles:
   *                     type: array
   *                     items:
   *                       type: string
   *                   writeRoles:
   *                     type: array
   *                     items:
   *                       type: string
   */
  administrationRouter.post(
    '/:namespace/definitions/:name',
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user = req.user as User;
      const namespace = req.params.namespace;
      const name = req.params.name;
      valueRepository.getNamespace(namespace)
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('Value Namespace', namespace);
        } else if (!entity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access namespace.');
        }
        return entity;
      })
      .then((entity) =>
        entity.updateDefinition(user, name, req.body)
      )
      .then((entity) =>
        res.send(mapValueDefinition(namespace, entity))
      )
      .catch(err => next(err));
    }
  );

  return administrationRouter;
}
