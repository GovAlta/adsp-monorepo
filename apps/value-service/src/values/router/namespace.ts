import { Router } from 'express';
import {
  User,
  assertAuthenticatedHandler,
  Update,
  NotFoundError,
  UnauthorizedError,
} from '@core-services/core-common';
import { ValuesRepository } from '../repository';
import { NamespaceEntity } from '../model';
import { Namespace } from '../types';
import { mapNamespace } from './mappers';

interface NamespaceRouterProps {
  valueRepository: ValuesRepository;
}

export const createNamespaceRouter = ({
  valueRepository,
}: NamespaceRouterProps): Router => {
  const namespaceRouter = Router();

  /**
   * @swagger
   *
   * /namespace/v1/namespaces:
   *   get:
   *     tags:
   *     - Value Namespace
   *     description: Retrieves value namespaces.
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
   *         description: Value namespaces succesfully retrieved.
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
    async (req, res, next) => {
      const user: User = req.user as User;
      const top: number = parseInt((req.query.top as string) || '10', 10);
      const after: string = req.query.after as string;

      try {
        var result = await valueRepository.getNamespaces(top, after);

        res.json({
          results: result.results
            .filter((r) => r.canAccess(user))
            .map(mapNamespace),
          page: result.page,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * @swagger
   *
   * /namespace/v1/namespaces:
   *   post:
   *     tags:
   *     - Value Namespace
   *     description: Creates a new value namespace.
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
   *         description: Namespace successfully created or updated.
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
   *         description: User not authorized to create namepace.
   */
  namespaceRouter.post(
    '/namespaces',
    assertAuthenticatedHandler,
    async (req, res, next) => {
      const user: User = req.user as User;
      const namespace: Namespace = req.body;

      try {
        var entity = await NamespaceEntity.create(
          user,
          valueRepository,
          namespace
        );

        res.json(mapNamespace(entity));
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * @swagger
   *
   * /namespace/v1/namespaces/{namespace}:
   *   get:
   *     tags:
   *     - Value Namespace
   *     description: Retrieves a specified value namespace.
   *     parameters:
   *     - name: namespace
   *       description: Name of the value namespace to retrieve.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Value namespace successfully retrieved.
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
    async (req, res, next) => {
      const user: User = req.user as User;
      const name: string = req.params.namespace;

      try {
        var entity = await valueRepository.getNamespace(name);

        if (!entity) {
          throw new NotFoundError('Value Namespace', name);
        } else if (!entity.canAccess(user)) {
          throw new UnauthorizedError(
            'User not authorized to access namespace.'
          );
        }

        res.send(mapNamespace(entity));
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * @swagger
   *
   * /namespace/v1/namespaces/{namespace}:
   *   post:
   *     tags:
   *     - Value Namespace
   *     description: Updates a value namespace.
   *     parameters:
   *     - name: namespace
   *       description: Name of the value namespace to update.
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
   *                 spaceAdminRole:
   *                   type: string
   *       401:
   *         description: User not authorized to update value namespace.
   */
  namespaceRouter.post(
    '/namespaces/:namespace',
    assertAuthenticatedHandler,
    async (req, res, next) => {
      const user: User = req.user as User;
      const update: Update<Namespace> = req.body;
      const name: string = req.params.namespace;

      try {
        var entity = await valueRepository.getNamespace(name);

        entity.update(user, update);

        res.json({
          name: entity.name,
          description: entity.description,
          definitions: entity.definitions,
          adminRole: entity.adminRole,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return namespaceRouter;
};
