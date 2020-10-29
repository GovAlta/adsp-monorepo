import { Router } from 'express';
import { User, assertAuthenticatedHandler, Update } from '@core-services/core-common';
import { ValuesRepository } from '../repository';
import { NamespaceEntity } from '../model';
import { Namespace } from '../types';

interface NamespaceRouterProps {
  valueRepository: ValuesRepository
}

export const createNamespaceRouter = ({
  valueRepository
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
    (req, res, next) => {
      const user: User = req.user as User;
      const top: number = parseInt(req.query.top as string || '10', 10);
      const after: string = req.query.after as string;
      valueRepository.getNamespaces(
        user, top, after
      ).then((result) => res.json({
        results: result.results,
        page: result.page
      })).catch((err) => 
        next(err)
      );
    }
  )
  
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
    (req, res, next) => {
      const user: User = req.user as User;
      const namespace: Namespace = req.body;
      NamespaceEntity.create(
        user, valueRepository, namespace
      ).then((entity) => res.json({
        name: entity.name,
        description: entity.description,
        definitions: entity.definitions,
        adminRole: entity.adminRole
      })).catch((err) => 
        next(err)
      );
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
    (req, res, next) => {
      const user: User = req.user as User;
      const name: string = req.params.namespace;
      valueRepository.getNamespace(
        user, name
      )
      .then(
        (entity) => entity ? res.json({
          name: entity.name,
          description: entity.description, 
          definitions: entity.definitions,
          adminRole: entity.adminRole
        }) : res.sendStatus(404)
      )
      .catch((err) => next(err));
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
    (req, res, next) => {
      const user: User = req.user as User;
      const update: Update<Namespace> = req.body;
      const name: string = req.params.namespace;

      valueRepository.getNamespace(
        user, name
      )
      .then(
        (entity) => entity.update(user, update)
      )
      .then((entity) => res.json({
        name: entity.name,
        description: entity.description,
        definitions: entity.definitions,
        adminRole: entity.adminRole
      }))
      .catch((err) => next(err));
    }
  );

  return namespaceRouter;
}
