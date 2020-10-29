import { assertAuthenticatedHandler, NotFoundError, User } from '@core-services/core-common';
import { Router } from 'express';
import { ValuesRepository } from '../repository';
import { MetricCriteria, MetricInterval, Value, ValueCriteria } from '../types';

interface ValueRouterProps {
  valueRepository: ValuesRepository
}

export const createValueRouter = ({
  valueRepository
}: ValueRouterProps): Router => {

  const valueRouter = Router();
  
  /**
   * @swagger
   * 
   * '/{namespace}/values':
   *   get:
   *     tags:
   *     - Value
   *     description: Reads namespace values. 
   *     parameters:
   *     - name: namespace
   *       description: Namespace to read values from.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       '200':
   *         description: Values successfully read.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  valueRouter.get(
    '/:namespace/values',
    (req, res, next) => {
      const user = req.user as User;
      const namespace = req.params.namespace;
      
      valueRepository.getNamespace(user, namespace)
      .then(entity =>{
        if (!entity) {
          throw new NotFoundError('namespace', namespace);
        }

        const names = req.query.names ?
          (req.query.names as string)
          .split(',')
          .map(name => name.trim()) : 
          Object.keys(entity.definitions);

        return Promise.all(
          names.map(name => entity.definitions[name] ? 
            new Promise((resolve) => {
              try {
                resolve(
                  entity.definitions[name].readValues(user, {top: 1})
                  .then(([value]) => ({name, value})) 
                );
              }
              catch (err) {
                resolve({name});
              }
            }) :
            Promise.resolve({name})
          )
        );
      })
      .then(
        (results: {name: string, value: Value}[]) => res.send({
          [namespace]: results.reduce(
            (v, c) => ({...v, [c.name]: c.value}), {}
          )
        })
      )
      .catch(err => next(err))
    }
  );

  /**
   * @swagger
   * 
   * '/{namespace}/values/{name}':
   *   get:
   *     tags:
   *     - Value
   *     description: Reads a namespace value.
   *     parameters:
   *     - name: namespace
   *       description: Namespace to read value from.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: name
   *       description: Name of the value to read.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: criteria
   *       description: Criteria for the read.
   *       in: query
   *       required: false
   *       schema:
   *         type: object
   *         properties:
   *           top:
   *             type: number
   *           timestampMax:
   *             type: string
   *             format: date-time
   *           timestampMin:
   *             type: string
   *             format: date-time
   *     responses:
   *       '200':
   *         description: Value successfully read.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  valueRouter.get(
    '/:namespace/values/:name',
    (req, res, next) => {
      const user = req.user as User;
      const namespace = req.params.namespace;
      const name = req.params.name;
      const criteriaParam = req.query.criteria ? 
        JSON.parse(req.query.criteria as string) : 
        {};
      
      const criteria: ValueCriteria = {
        top: criteriaParam.top,
        timestampMax: criteriaParam.timestampMax ?
          new Date(criteriaParam.timestampMax) : null,
        timestampMin: criteriaParam.timestampMin ?
          new Date(criteriaParam.timestampMin) : null
      }
      
      valueRepository.getNamespace(user, namespace)
      .then(entity =>
        entity && entity.definitions[name]
      )
      .then(entity => {
        if (!entity) {
          throw new NotFoundError('value definition', `${namespace}:${name}`);
        }
        return entity.readValues(user, criteria)
      })
      .then(results => res.send({
        [namespace]: {
          [name]: results
        }
      }))
      .catch(err => next(err));
    }
  );

  /**
   * @swagger
   * 
   * '/{namespace}/values/{name}/metrics/{metric}':
   *   get:
   *     tags:
   *     - Value
   *     description: Retrieves value metric in a namespace 
   *     parameters:
   *     - name: namespace
   *       description: Namespace to read value metric from.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: name
   *       description: Name of the value.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: metric
   *       description: Name of the metric to read.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: criteria
   *       description: Criteria for the read.
   *       in: query
   *       required: false
   *       schema:
   *         type: object
   *         properties:
   *           interval:
   *             type: string
   *             enum:
   *             - hourly 
   *             - daily 
   *             - weekly
   *           intervalMax:
   *             type: string
   *             format: date-time
   *           intervalMin:
   *             type: string
   *             format: date-time
   *     responses:
   *       '200':
   *         description: Metric successfully read.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  valueRouter.get(
    '/:namespace/values/:name/metrics/:metric',
    (req, res, next) => {
      const user = req.user as User;
      const namespace = req.params.namespace;
      const name = req.params.name;
      const metric = req.params.metric;
      const interval = req.query.interval as string || 'daily';
      const criteriaParam = req.query.criteria ? 
        JSON.parse(req.query.criteria as string) : 
        {};
      
      const criteria: MetricCriteria = {
        interval: interval as MetricInterval,
        intervalMax: criteriaParam.intervalMax ?
          new Date(criteriaParam.intervalMax) : null,
        intervalMin: criteriaParam.intervalMin ?
          new Date(criteriaParam.intervalMin) : null
      }

      valueRepository.getNamespace(user, namespace)
      .then(entity =>
        entity && entity.definitions[name]
      )
      .then(entity => {
        if (!entity) {
          throw new NotFoundError('value definition', `${namespace}:${name}`);
        }
        return entity.readValueMetric(
          user, metric, criteria
        );
      })
      .then(result => res.send({
        [namespace]: {
          [name]: {
            [metric]: result
          }
        }
      }))
      .catch(err => next(err));
    }
  )

  /**
   * @swagger
   * '/{namespace}/values/{name}':
   *   post:
   *     tags:
   *     - Value
   *     description: Writes namespace value.
   *     parameters: 
   *     - name: namespace
   *       description: Namespace to read value from.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     - name: name
   *       description: Name of the value to read.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             oneOf:
   *             - type: object
   *               properties:
   *                 correlationId:
   *                   type: string
   *                 context:
   *                   type: object
   *                 timestamp: 
   *                   type: string
   *                   format: date-time
   *                 value:
   *                   type: object
   *             - type: object
   *     responses:
   *       '200':
   *         description: Value successfully written.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  valueRouter.post(
    '/:namespace/values/:name', 
    assertAuthenticatedHandler,
    (req, res, next) => {
      const user = req.user as User;
      const namespace = req.params.namespace;
      const name = req.params.name;
      valueRepository.getNamespace(user, namespace)
      .then(entity =>
        entity && entity.definitions[name]
      )
      .then(entity => {
        if (!entity) {
          throw new NotFoundError('value definition', `${namespace}: ${name}`)
        }
        
        return entity.writeValue(user, req.body)
      })
      .then(result => res.send({
        [namespace]: {
          [name]: [result]
        }
      }))
      .catch(err => next(err))
    }
  );

  return valueRouter;
}
