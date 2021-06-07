import { AdspId, EventService, User } from '@abgov/adsp-service-sdk';
import {
  AjvValidationService,
  assertAuthenticatedHandler,
  NotFoundError,
  UnauthorizedError,
} from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { NamespaceEntity } from '../model';
import { ValuesRepository } from '../repository';
import { MetricCriteria, MetricInterval, ServiceUserRoles, Value, ValueCriteria } from '../types';

interface ValueRouterProps {
  logger: Logger;
  repository: ValuesRepository;
  eventService: EventService;
}

export const createValueRouter = ({ logger, repository, eventService }: ValueRouterProps): Router => {
  const valueRouter = Router();

  valueRouter.get('/:namespace/values', async (req, res, next) => {
    const user = req.user;
    const namespace = req.params.namespace;

    try {
      const namespaces = await req.getConfiguration<Record<string, NamespaceEntity>>();
      const entity = namespaces[namespace];
      if (!entity) {
        throw new NotFoundError('namespace', namespace);
      }

      const names = req.query.names
        ? (req.query.names as string).split(',').map((name) => name.trim())
        : Object.keys(entity.definitions);

      const results: { name: string; value: Value }[] = await Promise.all(
        names.map(async (name) => ({
          name,
          value: (await entity.definitions[name].readValues(user, { top: 1 }))[0],
        }))
      );

      res.send({
        [namespace]: results.reduce((v, c) => ({ ...v, [c.name]: c.value }), {}),
      });
    } catch (err) {
      next(err);
    }
  });

  valueRouter.get('/:namespace/values/:name', async (req, res, next) => {
    const user = req.user as User;
    const namespace = req.params.namespace;
    const name = req.params.name;
    const criteriaParam = req.query.criteria ? JSON.parse(req.query.criteria as string) : {};

    const criteria: ValueCriteria = {
      top: criteriaParam.top,
      timestampMax: criteriaParam.timestampMax ? new Date(criteriaParam.timestampMax) : null,
      timestampMin: criteriaParam.timestampMin ? new Date(criteriaParam.timestampMin) : null,
    };

    if (!user?.roles?.includes(ServiceUserRoles.Reader)) {
      next(new UnauthorizedError('User not authorized to read values.'));
      return;
    }

    try {
      const results = await repository.readValues(user.tenantId, namespace, name, criteria);

      res.send({
        [namespace]: {
          [name]: results,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  valueRouter.get('/:namespace/values/:name/metrics/:metric', async (req, res, next) => {
    const user = req.user as User;
    const namespace = req.params.namespace;
    const name = req.params.name;
    const metric = req.params.metric;
    const interval = (req.query.interval as string) || 'daily';
    const criteriaParam = req.query.criteria ? JSON.parse(req.query.criteria as string) : {};

    const criteria: MetricCriteria = {
      interval: interval as MetricInterval,
      intervalMax: criteriaParam.intervalMax ? new Date(criteriaParam.intervalMax) : null,
      intervalMin: criteriaParam.intervalMin ? new Date(criteriaParam.intervalMin) : null,
    };

    try {
      const namespaces = await req.getConfiguration<Record<string, NamespaceEntity>>();
      const entity = namespaces[namespace];
      if (!entity) {
        throw new NotFoundError('namespace', namespace);
      }
      const valDef = entity.definitions[name];
      if (!valDef) {
        throw new NotFoundError('value definition', `${namespace}:${name}`);
      }

      const result = await valDef.readValueMetric(user, metric, criteria);

      res.send({
        [namespace]: {
          [name]: {
            [metric]: result,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  });

  valueRouter.post('/:namespace/values/:name', assertAuthenticatedHandler, async (req, res, next) => {
    const user = req.user as User;
    const namespace = req.params.namespace;
    const name = req.params.name;
    const { tenantId, ...value } = req.body;

    try {
      const namespaces = await req.getConfiguration<Record<string, NamespaceEntity>>();
      const entity =
        namespaces[namespace] ||
        new NamespaceEntity(
          new AjvValidationService(logger),
          repository,
          {
            name: namespace,
            description: null,
            definitions: { [name]: { name, description: null, type: null, jsonSchema: null } },
          },
          user.tenantId
        );

      const valDef = entity.definitions[name];
      if (!valDef) {
        throw new NotFoundError('value definition', `${namespace}: ${name}`);
      }

      const result = await valDef.writeValue(user, tenantId ? AdspId.parse(tenantId) : null, value);

      res.send({
        [namespace]: {
          [name]: [result],
        },
      });

      eventService.send({
        name: 'value-written',
        timestamp: new Date(),
        correlationId: result.correlationId,
        payload: {
          namespace,
          name,
          value: result,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return valueRouter;
};
