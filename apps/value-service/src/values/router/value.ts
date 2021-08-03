import { AdspId, EventService, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { valueWritten } from '../events';
import { NamespaceEntity } from '../model';
import { ValuesRepository } from '../repository';
import { MetricCriteria, MetricInterval, ServiceUserRoles, Value, ValueCriteria } from '../types';

interface ValueRouterProps {
  logger: Logger;
  repository: ValuesRepository;
  eventService: EventService;
}

export const assertUserCanWrite: RequestHandler = async (req, res, next) => {
  const user = req.user;
  const { tenantId: tenantIdValue } = req.body;

  if (!user?.roles?.includes(ServiceUserRoles.Writer)) {
    next(new UnauthorizedUserError('write value', user));
    return;
  }

  // If tenant is explicity specified, then the user must be a core user.
  if (tenantIdValue && !user.isCore) {
    next(new UnauthorizedUserError('write tenant tenant.', user));
    return;
  }

  // Use the specified tenantId or the user's tenantId.
  const tenantId = tenantIdValue ? AdspId.parse(tenantIdValue as string) : user.tenantId;
  req['tenantId'] = tenantId;

  next();
};

export const createValueRouter = ({ logger, repository, eventService }: ValueRouterProps): Router => {
  const valueRouter = Router();

  valueRouter.get('/:namespace/values', async (req, res, next) => {
    const user = req.user;
    const namespace = req.params.namespace;

    try {
      const [namespaces] = await req.getConfiguration<Record<string, NamespaceEntity>>();
      const entity = namespaces?.[namespace];
      if (!entity) {
        throw new NotFoundError('namespace', namespace);
      }

      const names = req.query.names
        ? (req.query.names as string).split(',').map((name) => name.trim())
        : Object.keys(entity.definitions);

      const results: { name: string; value: Value }[] = await Promise.all(
        names.map(async (name) => ({
          name,
          value: (await entity.definitions[name].readValues(user, user.tenantId, 1)).results[0],
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
    const user = req.user;
    const { namespace, name } = req.params;
    const {
      top: topValue,
      after,
      timestampMax: timestampMaxValue,
      timestampMin: timestampMinValue,
      context: contextValue,
      tenantId: tenantValue,
      correlationId,
    } = req.query;

    if (!user?.roles?.includes(ServiceUserRoles.Reader)) {
      next(new UnauthorizedError('User not authorized to read values.'));
      return;
    }

    try {
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria: ValueCriteria = {
        namespace,
        name,
        timestampMax: timestampMaxValue ? new Date(timestampMaxValue as string) : null,
        timestampMin: timestampMinValue ? new Date(timestampMinValue as string) : null,
        context: contextValue ? JSON.parse(contextValue as string) : null,
        correlationId: correlationId as string,
        tenantId: tenantValue ? AdspId.parse(tenantValue as string) : null,
      };

      // For non Core users, the tenant criteria is set based on the user's tenant.
      if (!user.isCore) {
        criteria.tenantId = user.tenantId;
      }

      const result = await repository.readValues(top, after as string, criteria);

      res.send({
        [namespace]: {
          [name]: result.results,
        },
        page: result.page,
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

    const tenantId = user.isCore ? AdspId.parse(criteriaParam.tenantId) : user.tenantId;

    if (!user?.roles?.includes(ServiceUserRoles.Reader)) {
      next(new UnauthorizedError('User not authorized to read values.'));
      return;
    }

    try {
      const result = await repository.readMetric(tenantId, namespace, name, metric, criteria);
      res.send(result);
    } catch (err) {
      next(err);
    }
  });

  valueRouter.post('/:namespace/values/:name', assertUserCanWrite, async (req, res, next) => {
    const namespace = req.params.namespace;
    const name = req.params.name;

    logger.debug(`Processing write value ${namespace}:${name}...`);

    const { tenantId: _tenantId, ...value } = req.body;
    const tenantId: AdspId = req['tenantId'];

    try {
      const [namespaces] = await req.getConfiguration<Record<string, NamespaceEntity>>(tenantId);

      // Handle either value write with envelop included or not.
      const valueRecord: Omit<Value, 'tenantId'> =
        (value as Value).value === undefined
          ? {
              context: {},
              correlationId: null,
              timestamp: new Date(),
              value,
            }
          : value;

      // Write via the definition (which will validate) or directly if there is no definition.
      const definition = namespaces?.[namespace]?.definitions[name];
      let result: Value = null;
      if (definition) {
        result = await definition.writeValue(tenantId, valueRecord);
      } else {
        result = await repository.writeValue(namespace, name, tenantId, valueRecord);
      }

      res.send(result);

      eventService.send(valueWritten(req.user, namespace, name, result));

      logger.info(`Value ${namespace}:${name} written by user ${req.user.name} (ID: ${req.user.id}).`);
    } catch (err) {
      next(err);
    }
  });

  return valueRouter;
};
