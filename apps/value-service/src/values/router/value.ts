import { AdspId, DomainEvent, EventService, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError, decodeAfter } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { checkSchema, param, query } from 'express-validator';
import { Logger } from 'winston';
import { valueWritten } from '../events';
import { NamespaceEntity } from '../model';
import { ValuesRepository } from '../repository';
import { ExportServiceRoles, MetricCriteria, MetricInterval, ServiceUserRoles, Value, ValueCriteria } from '../types';

interface ValueRouterProps {
  logger: Logger;
  repository: ValuesRepository;
  eventService: EventService;
}

const mapValue = (value: Value) => {
  if (value) {
    const { tenantId: _tenantId, ...result } = value;

    return result;
  } else {
    return null;
  }
};

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

    let results: { name: string; value: Value }[] = await Promise.all(
      names.map(async (name) => {
        const result = entity.definitions[name] && (await entity.definitions[name].readValues(user, user.tenantId, 1));
        if (!result) return null;
        return {
          name,
          value: result && result.results[0],
        };
      })
    );

    results = results.filter((name) => {
      return name !== null;
    });

    if (results.length === 0) {
      throw new NotFoundError('names within namespace', namespace);
    }

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
        value,
        url,
      } = req.query;

      if (!tenant) {
        throw new InvalidOperationError('Tenant context is required for operation.');
      }

      if (!isAllowedUser(user, tenant.id, [ServiceUserRoles.Reader, ExportServiceRoles.ExportJob], true)) {
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
        value: value as string,
        url: url as string,
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

export function countValue(repository: ValuesRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenant = req.tenant;
      const user = req.user;
      const { namespace, name } = req.params;
      const {
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

      const criteria: ValueCriteria = {
        namespace,
        name,
        timestampMax: timestampMaxValue ? new Date(timestampMaxValue as string) : null,
        timestampMin: timestampMinValue ? new Date(timestampMinValue as string) : null,
        context: contextValue ? JSON.parse(contextValue as string) : null,
        correlationId: correlationId as string,
        tenantId: tenant.id,
      };

      const count = await repository.countValues(criteria);
      res.send({
        namespace,
        name,
        count,
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

    if (!tenantId) {
      throw new InvalidOperationError('Cannot write value without tenant context');
    }

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
      const tenantId: AdspId = req['tenantId'];

      logger.debug(`Processing write value ${namespace}:${name}...`, {
        context: 'value-router',
        tenantId: tenantId?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      let namespaces: Record<string, NamespaceEntity>;
      try {
        [namespaces] = await req.getConfiguration<Record<string, NamespaceEntity>>(tenantId);
      } catch (err) {
        // Catch and log error on configuration retrieval.
        // The value service is biased to writing the value even if the definition retrieval fails.
        logger.warn(
          `Error encountered retrieving value configuration; value will be written without definition: ${err}`,
          {
            context: 'value-router',
            tenantId: tenantId?.toString(),
            user: `${user.name} (ID: ${user.id})`,
          }
        );
      }

      const valuesToWrite = Array.isArray(req.body) ? req.body : [req.body];
      const events: DomainEvent[] = [];
      const prepared = valuesToWrite
        .map((valueToWrite) => {
          try {
            const { tenantId: _tenantId, timestamp: timestampValue, ...value } = valueToWrite;

            // Handle either value write with envelop included or not.
            let valueRecord: Omit<Value, 'tenantId'> =
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
            if (definition) {
              valueRecord = definition.prepareWrite(tenantId, valueRecord);

              if (definition.sendWriteEvent) {
                events.push(valueWritten(req.user, namespace, name, { tenantId, ...valueRecord }));
              }
            }

            return valueRecord;
          } catch (err) {
            logger.warn(`Error encountered writing value ${namespace}:${name}: ${err}`, {
              context: 'value-router',
              tenantId: tenantId?.toString(),
              user: `${user.name} (ID: ${user.id})`,
            });

            return;
          }
        })
        .filter((value) => !!value);

      const results = await repository.writeValues(namespace, name, tenantId, prepared);
      for (const event of events) {
        eventService.send(event);
      }

      logger.info(
        `${results.length} of ${valuesToWrite.length} requested values for ${namespace}:${name} written by user ${user.name} (ID: ${user.id}).`,
        {
          context: 'value-router',
          tenantId: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );

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
    '/:namespace/values/:name/count',
    validateNamespaceNameHandler,
    createValidationHandler(
      ...checkSchema(
        {
          correlationId: { optional: true, isString: true },
          timestampMin: { optional: true, isISO8601: true },
          timestampMax: { optional: true, isISO8601: true },
        },
        ['query']
      )
    ),
    countValue(repository)
  );

  valueRouter.get(
    '/:namespace/values/:name/metrics',
    validateNamespaceNameHandler,
    createValidationHandler(
      query('interval').optional().isString(),
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
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
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
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
          timestamp: {
            optional: true,
            isISO8601: true,
          },
          context: {
            optional: { options: { nullable: true } },
            isObject: true,
          },
          correlationId: {
            optional: { options: { nullable: true } },
            isString: true,
          },
        },
        ['body']
      )
    ),
    writeValue(logger, eventService, repository)
  );

  return valueRouter;
};
