import {
  adspId,
  AdspId,
  EventService,
  isAllowedUser,
  startBenchmark,
  UnauthorizedUserError,
} from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  Results,
  decodeAfter,
  UnauthorizedError,
} from '@core-services/core-common';
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import { Request, RequestHandler, Router } from 'express';
import { body, checkSchema, param, query } from 'express-validator';
import { isEqual as isDeepEqual, unset, cloneDeep } from 'lodash';
import { Logger } from 'winston';
import { configurationUpdated, revisionCreated, activeRevisionSet, configurationDeleted } from '../events';
import { ConfigurationEntity } from '../model';
import { ConfigurationRepository, Repositories } from '../repository';
import { ConfigurationDefinition, ConfigurationDefinitions, ConfigurationRevision } from '../types';
import {
  OPERATION_DELETE,
  OPERATION_REPLACE,
  OPERATION_UPDATE,
  OPERATION_CREATE_REVISION,
  OPERATION_SET_ACTIVE_REVISION,
  PatchRequests,
  PostRequests,
} from './types';
import { ConfigurationServiceRoles, ExportServiceRoles } from '../roles';

export interface ConfigurationRouterProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  eventService: EventService;
}

const ENTITY_KEY = 'entity';
const rateLimitHandler = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

function resolveDefinition(entity: ConfigurationEntity<ConfigurationDefinitions>, namespace: string, name: string) {
  let result = entity?.latest?.configuration[`${namespace}:${name}`];

  // Look for a configuration definition at the namespace level.
  if (!result) {
    result = entity?.latest?.configuration[namespace];
    if (result) {
      result.isForNamespace = true;
    }
  }

  return result;
}

const getDefinition = async (
  configurationServiceId: AdspId,
  repository: ConfigurationRepository,
  namespace: string,
  name: string,
  tenantId?: AdspId
): Promise<ConfigurationDefinition> => {
  const core = await repository.get<ConfigurationDefinitions>(
    configurationServiceId.namespace,
    configurationServiceId.service
  );

  let result = resolveDefinition(core, namespace, name);
  if (!result && tenantId) {
    const tenant = await repository.get<ConfigurationDefinitions>(
      configurationServiceId.namespace,
      configurationServiceId.service,
      tenantId
    );
    result = resolveDefinition(tenant, namespace, name);
  }

  return result;
};

export const getTenantId = (req: Request): AdspId => {
  if (!req.isAuthenticated || !req.user) {
    if (req.query?.tenant) {
      return AdspId.parse(req.query.tenant as string);
    }

    if (req.query?.tenantId) {
      return AdspId.parse(req.query.tenantId as string);
    }
  }

  return req.tenant?.id;
};

export const assertAuthenticateConfigHandler =
  (configurationServiceId: AdspId, repository: ConfigurationRepository): RequestHandler =>
  async (req, _res, next) => {
    try {
      const { namespace, name } = req.params;

      const noUserContext = !req.isAuthenticated || !req.user;
      if (noUserContext) {
        const tenantId = getTenantId(req);
        const definition = await getDefinition(configurationServiceId, repository, namespace, name, tenantId);
        if (definition?.anonymousRead !== true) {
          throw new UnauthorizedError('Anonymous access to configuration not allowed.');
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };

/**
 * Get the configuration entity for the configuration namespace and name.
 *
 * @export
 * @param {AdspId} configurationServiceId ADSP ID of the configuration service.
 * @param {ConfigurationRepository} repository Repository for configuration records.
 * @param {boolean} [loadDefinition=true] Flag indicating if definition, which is used for write schema validation, should be loaded.
 * @param {boolean} [requestCore=(_req: Request): boolean => false] Function for determining if core context is requested.
 * @returns {RequestHandler}
 */
export function getConfigurationEntity(
  configurationServiceId: AdspId,
  repository: ConfigurationRepository,
  rateLimitHandler: RateLimitRequestHandler,
  loadDefinition: boolean = true,
  requestCore = (_req: Request): boolean => false
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'get-entity-time');

      const user = req.user;
      const { namespace, name } = req.params;
      const getCore = requestCore(req);
      const tenantId = getTenantId(req);

      // Handle the rest in a function.
      // The rate limit handler uses the next callback, so we can't just proceed assuming it's done after the call.
      const handle = async (err?: unknown) => {
        if (err) {
          next(err);
        } else {
          const definition = loadDefinition
            ? await getDefinition(configurationServiceId, repository, namespace, name, tenantId)
            : undefined;

          const entity = await repository.get(namespace, name, getCore ? null : tenantId, definition);

          if (req.isAuthenticated && user) {
            if (!entity.canAccess(user)) {
              throw new UnauthorizedUserError('access configuration', user);
            }
          }

          req[ENTITY_KEY] = entity;
          end();
          next();
        }
      };

      //if user is not logged in and is not authenticated we want
      //to do rate limiting for anonymous users.
      if (!req.isAuthenticated && !user) {
        // Note: this handler is actually awaitable (is async).
        await rateLimitHandler(req, res, handle);
      } else {
        await handle();
      }
    } catch (err) {
      next(err);
    }
  };
}

const mapConfiguration = (apiId: AdspId, configuration: ConfigurationEntity): Record<string, unknown> => {
  return {
    urn: adspId`${apiId}:/configuration/${configuration.namespace}/${configuration.name}`.toString(),
    namespace: configuration.namespace,
    name: configuration.name,
    latest: configuration.latest,
  };
};

const mapActiveRevision = (configuration: ConfigurationEntity, active: number) => ({
  namespace: configuration.namespace,
  name: configuration.name,
  active,
});

export function findConfiguration(apiId: AdspId, repository: ConfigurationRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { namespace } = req.params;
      const {
        top: topValue,
        after,
        includeActive: includeActiveValue,
        registeredId,
        criteria: criteriaValue,
      } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const includeActive = includeActiveValue === 'true';
      const criteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      if (
        !isAllowedUser(user, tenantId, ConfigurationServiceRoles.ConfigurationAdmin) &&
        !isAllowedUser(
          user,
          tenantId,
          [ConfigurationServiceRoles.ConfiguredService, ExportServiceRoles.ExportJob],
          true
        )
      ) {
        throw new UnauthorizedUserError('find configuration', user);
      }

      const { results: entities, page } = await repository.find(
        {
          ...criteria,
          tenantIdEquals: tenantId,
          namespaceEquals: namespace,
          registeredIdEquals: registeredId as string,
        },
        top,
        after as string
      );

      const results = [];
      for (const entity of entities) {
        const result = mapConfiguration(apiId, entity);
        if (includeActive) {
          result.active = await entity.getActiveRevision();
        }

        results.push(result);
      }

      res.send({
        results,
        page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const getConfiguration =
  (apiId: AdspId, mapResult = mapConfiguration): RequestHandler =>
  async (req, res) => {
    const configuration: ConfigurationEntity = req[ENTITY_KEY];

    const result = mapResult(apiId, configuration);
    res.send(result);
  };

export function getConfigurationWithActive(apiId: AdspId): RequestHandler {
  return async (req, res, next) => {
    try {
      const configuration: ConfigurationEntity = req[ENTITY_KEY];
      const active = await configuration.getActiveRevision();

      res.send({ ...mapConfiguration(apiId, configuration), active });
    } catch (err) {
      next(err);
    }
  };
}

export const patchConfigurationRevision =
  (apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const request: PatchRequests = req.body;
      const entity: ConfigurationEntity = req[ENTITY_KEY];

      let update: Record<string, unknown> = null;
      let updateData = null;
      switch (request.operation) {
        case OPERATION_REPLACE:
          if (!request.configuration) {
            throw new InvalidOperationError(`Replace request must include 'configuration' property.`);
          }
          update = request.configuration;
          updateData = request.configuration;
          break;
        case OPERATION_UPDATE:
          if (!request.update) {
            throw new InvalidOperationError(`Update request must include 'update' property.`);
          }

          update = entity.mergeUpdate(request.update);
          updateData = request.update;
          break;
        case OPERATION_DELETE:
          if (!request.property) {
            throw new InvalidOperationError(`Delete request must include 'property' property.`);
          }
          update = cloneDeep(entity.latest?.configuration || {});
          updateData = request.property;
          unset(update, request.property);
          break;
        default:
          throw new InvalidOperationError('Request does not include recognized operation.');
      }

      if (isDeepEqual(update, entity.latest?.configuration)) {
        logger.info(
          `Configuration ${entity.namespace}:${entity.name} update by ${user.name} (ID: ${user.id}) resulted in no changes to configuration.`,
          {
            tenant: entity.tenantId?.toString(),
            context: 'configuration-router',
            user: `${user.name} (ID: ${user.id})`,
          }
        );

        end();
        res.send(mapConfiguration(apiId, entity));
      } else {
        let updated = null;
        updated = await entity.update(user, update);
        end();
        res.send(mapConfiguration(apiId, updated));
        if (updated.tenantId) {
          eventService.send(
            configurationUpdated(
              apiId,
              user,
              updated.tenantId,
              updated.namespace,
              updated.name,
              updated.latest?.revision,
              updated.latest?.lastUpdated.toISOString(),
              {
                operation: request.operation,
                data: updateData,
              }
            )
          );
        }

        logger.info(`Configuration ${updated.namespace}:${updated.name} updated by ${user.name} (ID: ${user.id}).`, {
          tenant: updated.tenantId?.toString(),
          context: 'configuration-router',
          user: `${user.name} (ID: ${user.id})`,
        });
      }
    } catch (err) {
      next(err);
    }
  };

export const getActiveRevision =
  (logger: Logger): RequestHandler =>
  async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;

      const { orLatest: orLatestValue } = req.query;
      const orLatest = orLatestValue === 'true';
      const configuration: ConfigurationEntity = req[ENTITY_KEY];

      let result = await configuration.getActiveRevision();
      const revision = result?.revision;
      if (!result) {
        if (orLatest) {
          result = configuration.latest;
        }
      }

      end();
      res.send(result);

      if (user) {
        logger.info(
          `Active revision ${typeof revision === 'number' ? revision : `fallback to latest ${result?.revision}`} ` +
            `retrieved by ${user.name} (ID: ${user.id}).`,
          {
            tenant: configuration.tenantId?.toString(),
            context: 'configuration-router',
            user: `${user.name} (ID: ${user.id})`,
          }
        );
      } else {
        //If this an anonymous user, just log the tenant as there will be no user context information
        logger.info(`Active revision ${revision} for ${configuration.tenantId?.toString()} retrieved.`, {
          tenant: configuration.tenantId?.toString(),
          context: 'configuration-router',
        });
      }
    } catch (err) {
      next(err);
    }
  };

export const configurationOperations =
  (apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const request: PostRequests = req.body;
      const configuration: ConfigurationEntity = req[ENTITY_KEY];

      switch (request.operation) {
        case OPERATION_CREATE_REVISION: {
          const updated = await configuration.createRevision(user);

          res.send(mapConfiguration(apiId, updated));
          if (updated.tenantId) {
            eventService.send(
              revisionCreated(
                user,
                updated.tenantId,
                updated.namespace,
                updated.name,
                updated.latest?.created.toISOString(),
                updated.latest?.revision
              )
            );
          }

          logger.info(
            `Configuration revision ${updated.namespace}:${updated.name}:${updated.latest?.revision} created` +
              ` by ${user.name} (ID: ${user.id}).`,
            {
              tenant: updated.tenantId?.toString(),
              context: 'configuration-router',
              user: `${user.name} (ID: ${user.id})`,
            }
          );
          break;
        }
        case OPERATION_SET_ACTIVE_REVISION: {
          // If the old property is set but new one isn't, then use it.
          if (typeof request.setActiveRevision === 'number' && typeof request.revision !== 'number') {
            request.revision = request.setActiveRevision;
          }

          if (typeof request.revision !== 'number') {
            throw new InvalidOperationError(`Set active revision request must include revision property.`);
          }

          const oldRevision = await configuration.getActiveRevision();
          if (oldRevision?.revision !== request.revision) {
            const newRevision = await configuration.setActiveRevision(user, request.revision);
            eventService.send(
              activeRevisionSet(
                user,
                configuration.tenantId,
                configuration.namespace,
                configuration.name,
                newRevision.revision,
                oldRevision?.revision
              )
            );

            logger.info(
              `Active revision ${configuration.namespace}:${configuration.name}:${oldRevision?.revision} changed to revision ${newRevision.revision}` +
                ` by ${user.name} (ID: ${user.id}).`,
              {
                tenant: configuration.tenantId?.toString(),
                context: 'configuration-router',
                user: `${user.name} (ID: ${user.id})`,
              }
            );
          } else {
            logger.info(
              `Active revision ${configuration.namespace}:${configuration.name}:${oldRevision?.revision} set` +
                ` by ${user.name} (ID: ${user.id}) to same revision as current.`,
              {
                tenant: configuration.tenantId?.toString(),
                context: 'configuration-router',
                user: `${user.name} (ID: ${user.id})`,
              }
            );
          }

          res.send(mapActiveRevision(configuration, request.revision));

          break;
        }
        default:
          throw new InvalidOperationError('Specified operation not supported.');
      }

      end();
    } catch (err) {
      next(err);
    }
  };

export function deleteConfiguration(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const configuration: ConfigurationEntity = req[ENTITY_KEY];

      const deleted = await configuration.delete(user);

      end();
      res.send({ deleted });
      if (deleted) {
        eventService.send(
          configurationDeleted(apiId, user, configuration.tenantId, configuration.namespace, configuration.name)
        );
      }

      logger.info(
        `Configuration ${configuration.namespace}:${configuration.name} deleted by ${user.name} (ID: ${user.id}).`,
        {
          tenant: configuration.tenantId?.toString(),
          context: 'configuration-router',
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

export const getRevisions =
  (
    getCriteria = (req: Request) => {
      const { criteria } = req.query;
      return criteria ? JSON.parse(criteria as string) : {};
    },
    mapResults = (_req: Request, results: Results<ConfigurationRevision>): unknown => results
  ): RequestHandler =>
  async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');
      const { top: topValue, after: afterValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const after = afterValue as string;
      const criteria = getCriteria(req);

      const entity: ConfigurationEntity = req[ENTITY_KEY];
      const results = await entity.getRevisions(top, after, criteria);

      end();
      res.send(mapResults(req, results));
    } catch (err) {
      next(err);
    }
  };

export function createConfigurationRouter({
  logger,
  serviceId,
  eventService,
  configuration: configurationRepository,
}: ConfigurationRouterProps): Router {
  const apiId = adspId`${serviceId}:v2`;
  const router = Router();

  const validateNamespaceNameHandler = createValidationHandler(
    ...checkSchema(
      {
        namespace: { isString: true, matches: { options: /^[a-zA-Z0-9-_ ]{1,50}$/ } },
        name: { isString: true, matches: { options: /^[a-zA-Z0-9-_ ]{1,50}$/ } },
      },
      ['params']
    )
  );

  router.get(
    '/configuration/:namespace',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('namespace')
        .isString()
        .matches(/^[a-zA-Z0-9-_ ]{1,50}$/),
      query('top').optional().isInt({ min: 1, max: 1000 }),
      query('after').optional().isString(),
      query('includeActive').optional().isBoolean(),
      query('registerIdEquals').optional().isBoolean(),
      query('criteria').optional().isJSON()
    ),
    findConfiguration(apiId, configurationRepository)
  );

  router.get(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    getConfigurationEntity(
      serviceId,
      configurationRepository,
      rateLimitHandler,
      true,
      (req) => req.query.core !== undefined
    ),
    getConfigurationWithActive(apiId)
  );

  router.get(
    '/configuration/:namespace/:name/latest',
    assertAuthenticateConfigHandler(serviceId, configurationRepository),
    validateNamespaceNameHandler,
    createValidationHandler(query('tenant').optional().isString()),
    getConfigurationEntity(
      serviceId,
      configurationRepository,
      rateLimitHandler,
      true,
      (req) => req.query.core !== undefined
    ),
    getConfiguration(apiId, (_, configuration) => configuration.latest?.configuration || {})
  );

  router.patch(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    createValidationHandler(body('operation').isString().isIn([OPERATION_DELETE, OPERATION_UPDATE, OPERATION_REPLACE])),
    getConfigurationEntity(serviceId, configurationRepository, rateLimitHandler),
    patchConfigurationRevision(apiId, logger, eventService)
  );

  router.post(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    createValidationHandler(
      body('operation').isString().isIn([OPERATION_SET_ACTIVE_REVISION, OPERATION_CREATE_REVISION]),
      body('revision').optional().isNumeric(),
      body('setActiveRevision').optional().isNumeric()
    ),
    getConfigurationEntity(serviceId, configurationRepository, rateLimitHandler),
    configurationOperations(apiId, logger, eventService)
  );

  router.delete(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    getConfigurationEntity(serviceId, configurationRepository, rateLimitHandler),
    deleteConfiguration(apiId, logger, eventService)
  );

  router.get(
    '/configuration/:namespace/:name/revisions',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        }),
      query('criteria').optional().isJSON()
    ),
    getConfigurationEntity(serviceId, configurationRepository, rateLimitHandler, true),
    getRevisions()
  );

  router.get(
    '/configuration/:namespace/:name/active',
    assertAuthenticateConfigHandler(serviceId, configurationRepository),
    validateNamespaceNameHandler,
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
    ),
    getConfigurationEntity(serviceId, configurationRepository, rateLimitHandler, true),
    getActiveRevision(logger)
  );

  router.get(
    '/configuration/:namespace/:name/revisions/:revision',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    createValidationHandler(
      ...checkSchema(
        {
          revision: { isInt: { options: { min: 0 } } },
        },
        ['params']
      )
    ),
    getConfigurationEntity(serviceId, configurationRepository, rateLimitHandler, true),
    getRevisions(
      (req) => ({ revision: req.params.revision }),
      (req, { results }) => {
        if (results.length < 1) {
          throw new NotFoundError('revision', req.params.revision);
        }
        return results[0]?.configuration;
      }
    )
  );

  return router;
}
