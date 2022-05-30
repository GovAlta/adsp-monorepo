import { AdspId, EventService, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { checkSchema, param, query } from 'express-validator';
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

const mapValue = ({ tenantId: _tenantId, ...value }: Value) => ({
  ...value,
});

export const readValues: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { namespace } = req.params;

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
      [namespace]: results.reduce((v, c) => ({ ...v, [c.name]: mapValue(c.value) }), {}),
    });
  } catch (err) {
    next(err);
  }
};

export function readValue(repository: ValuesRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenant = req.tenant;
      const user = req.user;
      const { namespace, name } = req.params;
      const {
        top: topValue,
        after,
        timestampMax: timestampMaxValue,
        timestampMin: timestampMinValue,
        context: contextValue,
        correlationId,
      } = req.query;

      if (!tenant) {
        throw new InvalidOperationError('Tenant context is required for operation.');
      }

      if (!isAllowedUser(user, tenant.id, ServiceUserRoles.Reader, true)) {
        throw new UnauthorizedUserError('read values', user);
      }

      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria: ValueCriteria = {
        namespace,
        name,
        timestampMax: timestampMaxValue ? new Date(timestampMaxValue as string) : null,
        timestampMin: timestampMinValue ? new Date(timestampMinValue as string) : null,
        context: contextValue ? JSON.parse(contextValue as string) : null,
        correlationId: correlationId as string,
        tenantId: tenant.id,
      };

      const result = await repository.readValues(top, after as string, criteria);
      res.send({
        [namespace]: {
          [name]: result.results.map(mapValue),
        },
        page: result.page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function readMetrics(repository: ValuesRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenant = req.tenant;
      const user = req.user as User;
      const { namespace, name } = req.params;
      const { interval: intervalValue, criteria: criteriaValue, top: topValue, after } = req.query;
      const interval = (intervalValue as string) || 'daily';
      const criteriaParam = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      const criteria: MetricCriteria = {
        interval: interval as MetricInterval,
        intervalMax: criteriaParam.intervalMax ? new Date(criteriaParam.intervalMax) : null,
        intervalMin: criteriaParam.intervalMin ? new Date(criteriaParam.intervalMin) : null,
        metricLike: criteriaParam.metricLike,
      };
      const top = topValue ? parseInt(topValue as string) : 100;

      if (!tenant) {
        throw new InvalidOperationError('Tenant context is required for operation.');
      }

      if (!isAllowedUser(user, tenant.id, ServiceUserRoles.Reader, true)) {
        throw new UnauthorizedUserError('read values', user);
      }

      const result = await repository.readMetrics(tenant.id, namespace, name, top, after as string, criteria);
      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export function readMetric(repository: ValuesRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenant = req.tenant;
      const user = req.user as User;
      const { namespace, name, metric } = req.params;
      const { interval: intervalValue, criteria: criteriaValue, top: topValue, after } = req.query;
      const interval = (intervalValue as string) || 'daily';
      const criteriaParam = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      const criteria: MetricCriteria = {
        interval: interval as MetricInterval,
        intervalMax: criteriaParam.intervalMax ? new Date(criteriaParam.intervalMax) : null,
        intervalMin: criteriaParam.intervalMin ? new Date(criteriaParam.intervalMin) : null,
      };
      const top = topValue ? parseInt(topValue as string) : 100;

      if (!tenant) {
        throw new InvalidOperationError('Tenant context is required for operation.');
      }

      if (!isAllowedUser(user, tenant.id, ServiceUserRoles.Reader, true)) {
        throw new UnauthorizedUserError('read values', user);
      }

      const result = await repository.readMetric(tenant.id, namespace, name, metric, top, after as string, criteria);
      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export const assertUserCanWrite: RequestHandler = async (req, _res, next) => {
  try {
    const user = req.user;
    const { tenantId: tenantIdValue } = req.body;

    // Use the specified tenantId or the tenant resolved by the tenant handler.
    const tenantId = tenantIdValue ? AdspId.parse(tenantIdValue as string) : req.tenant?.id || user.tenantId;

    if (!isAllowedUser(user, tenantId, ServiceUserRoles.Writer, true)) {
      throw new UnauthorizedUserError('write value', user);
    }

    req['tenantId'] = tenantId;
    next();
  } catch (err) {
    next(err);
  }
};

export function writeValue(logger: Logger, eventService: EventService, repository: ValuesRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { namespace, name } = req.params;

      logger.debug(`Processing write value ${namespace}:${name}...`);

      const tenantId: AdspId = req['tenantId'];
      const [namespaces] = await req.getConfiguration<Record<string, NamespaceEntity>>(tenantId);

      const results = [];
      const valuesToWrite = Array.isArray(req.body) ? req.body : [req.body];
      for (const valueToWrite of valuesToWrite) {
        try {
          const { tenantId: _tenantId, timestamp: timestampValue, ...value } = valueToWrite;

          // Handle either value write with envelop included or not.
          const valueRecord: Omit<Value, 'tenantId'> =
            (value as Value).value === undefined
              ? {
                  context: {},
                  correlationId: null,
                  timestamp: new Date(),
                  value,
                }
              : {
                  ...value,
                  timestamp: timestampValue ? new Date(timestampValue) : new Date(),
                };

          // Write via the definition (which will validate) or directly if there is no definition.
          const definition = namespaces?.[namespace]?.definitions[name];
          let result: Value = null;
          if (definition) {
            result = await definition.writeValue(tenantId, valueRecord);
          } else {
            result = await repository.writeValue(namespace, name, tenantId, valueRecord);
          }

          results.push(result);
          eventService.send(valueWritten(req.user, namespace, name, result));

          logger.info(`Value ${namespace}:${name} written by user ${user.name} (ID: ${user.id}).`, {
            context: 'value-router',
            tenantId: tenantId?.toString(),
            user: `${user.name} (ID: ${user.id})`,
          });
        } catch (err) {
          logger.warn(`Error encountered writing value ${namespace}:${name}.`, {
            context: 'value-router',
            tenantId: tenantId?.toString(),
            user: `${user.name} (ID: ${user.id})`,
          });
        }
      }

      // Return an array if the original write is an array.
      if (Array.isArray(req.body)) {
        res.send(results.map(mapValue));
      } else {
        res.send(mapValue(results[0]));
      }
    } catch (err) {
      next(err);
    }
  };
}

export const createValueRouter = ({ logger, repository, eventService }: ValueRouterProps): Router => {
  const valueRouter = Router();

  const validateNamespaceNameHandler = createValidationHandler(
    ...checkSchema(
      {
        namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
        name: { isString: true, isLength: { options: { min: 1, max: 50 } } },
      },
      ['params']
    )
  );

  valueRouter.get(
    '/:namespace/values',
    createValidationHandler(
      param('namespace').isString().isLength({ min: 1, max: 50 }),
      query('names').optional().isString()
    ),
    readValues
  );

  valueRouter.get(
    '/:namespace/values/:name',
    validateNamespaceNameHandler,
    createValidationHandler(
      ...checkSchema(
        {
          top: { optional: true, isInt: { options: { min: 1, max: 5000 } } },
          after: { optional: true, isString: true },
          correlationId: { optional: true, isString: true },
          timestampMin: { optional: true, isISO8601: true },
          timestampMax: { optional: true, isISO8601: true },
        },
        ['query']
      )
    ),
    readValue(repository)
  );

  valueRouter.get(
    '/:namespace/values/:name/metrics',
    validateNamespaceNameHandler,
    createValidationHandler(
      query('interval').optional().isString(),
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after').optional().isString()
    ),
    readMetrics(repository)
  );

  valueRouter.get(
    '/:namespace/values/:name/metrics/:metric',
    createValidationHandler(
      ...checkSchema(
        {
          namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
          name: { isString: true, isLength: { options: { min: 1, max: 50 } } },
          metric: { isString: true, isLength: { options: { min: 1, max: 100 } } },
        },
        ['params']
      ),
      query('interval').optional().isString(),
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after').optional().isString()
    ),
    readMetric(repository)
  );

  valueRouter.post(
    '/:namespace/values/:name',
    assertUserCanWrite,
    validateNamespaceNameHandler,
    createValidationHandler(
      ...checkSchema(
        {
          timestamp: { optional: true, isISO8601: true },
          context: { optional: true, isObject: true },
          correlationId: { optional: true, isString: true },
        },
        ['body']
      )
    ),
    writeValue(logger, eventService, repository)
  );

  return valueRouter;
};
