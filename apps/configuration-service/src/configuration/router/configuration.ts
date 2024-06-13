import { AdspId, EventService, startBenchmark, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  Results,
  decodeAfter,
} from '@core-services/core-common';
import { Request, RequestHandler, Router } from 'express';
import { body, checkSchema, query } from 'express-validator';
import { isEqual as isDeepEqual, unset, cloneDeep } from 'lodash';
import { Logger } from 'winston';
import { configurationUpdated, revisionCreated, activeRevisionSet } from '../events';
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
  ConfigurationMap,
} from './types';

export interface ConfigurationRouterProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  eventService: EventService;
}

const ENTITY_KEY = 'entity';

const getDefinition = async (
  configurationServiceId: AdspId,
  repository: ConfigurationRepository,
  namespace: string,
  name: string,
  tenantId?: AdspId
): Promise<ConfigurationDefinition> => {
  const key = `${namespace}:${name}`;
  const core = await repository.get<ConfigurationDefinitions>(
    configurationServiceId.namespace,
    configurationServiceId.service
  );
  if (core?.latest?.configuration[key]) {
    return core.latest.configuration[key];
  } else if (tenantId) {
    const tenant = await repository.get<ConfigurationDefinitions>(
      configurationServiceId.namespace,
      configurationServiceId.service,
      tenantId
    );
    return tenant?.latest?.configuration[key] || tenant?.latest?.configuration[namespace];
  } else {
    return null;
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
  loadDefinition: boolean = true,
  requestCore = (_req: Request): boolean => false
): RequestHandler {
  return async (req, _res, next) => {
    try {
      const end = startBenchmark(req, 'get-entity-time');

      const user = req.user;
      const { namespace, name } = req.params;
      const getCore = requestCore(req);
      const tenantId = req.tenant?.id;

      const definition = loadDefinition
        ? await getDefinition(configurationServiceId, repository, namespace, name, tenantId)
        : undefined;

      const entity = await repository.get(namespace, name, getCore ? null : tenantId, definition);
      if (!entity.canAccess(user)) {
        throw new UnauthorizedUserError('access configuration', user);
      }

      req[ENTITY_KEY] = entity;

      end();
      next();
    } catch (err) {
      next(err);
    }
  };
}

const mapConfiguration = (configuration: ConfigurationEntity): ConfigurationMap => {
  return {
    namespace: configuration.namespace,
    name: configuration.name,
    latest: configuration.latest,
  };
};

const mapActiveRevision = (configuration: ConfigurationEntity, active: number): unknown => ({
  namespace: configuration.namespace,
  name: configuration.name,
  tenantId: configuration.tenantId,
  active,
});

export const getConfiguration =
  (mapResult = mapConfiguration): RequestHandler =>
  async (req, res) => {
    const configuration: ConfigurationEntity = req[ENTITY_KEY];

    res.send(mapResult(configuration));
  };

export const getConfigurationWithActive = (): RequestHandler => async (req, res) => {
  const configuration: ConfigurationEntity = req[ENTITY_KEY];

  const revision = await configuration.getActiveRevision();
  let active: ConfigurationRevision = undefined;
  // 0 is falsy and a valid revision.
  if (typeof revision === 'number') {
    active = (await configuration.getRevisions(1, null, { revision })).results[0];
  }

  res.send({ ...mapConfiguration(configuration), active });
};

export const patchConfigurationRevision =
  (logger: Logger, eventService: EventService): RequestHandler =>
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
        res.send(mapConfiguration(entity));
      } else {
        const updated = await entity.update(user, update);

        end();
        res.send(mapConfiguration(updated));
        if (updated.tenantId) {
          eventService.send(
            configurationUpdated(
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

      const revision = await configuration.getActiveRevision();

      const revisions = revision >= 0 ? await configuration.getRevisions(1, null, { revision }) : { results: [] };

      let {
        results: [result],
      } = revisions;

      if (!result) {
        if (orLatest) {
          result = configuration.latest;
        } else if (!revision) {
          end();
          res.status(200);
          res.send([]);
        } else {
          throw new NotFoundError('active revision');
        }
      }

      end();
      res.send(result);

      logger.info(`Active revision ${revision} ` + `retrieved by ${user.name} (ID: ${user.id}).`, {
        tenant: configuration.tenantId?.toString(),
        context: 'configuration-router',
        user: `${user.name} (ID: ${user.id})`,
      });
    } catch (err) {
      next(err);
    }
  };

export const configurationOperations =
  (logger: Logger, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const request: PostRequests = req.body;
      const configuration: ConfigurationEntity = req[ENTITY_KEY];

      if (request.operation === OPERATION_CREATE_REVISION) {
        const updated = await configuration.createRevision(user);

        end();
        res.send(mapConfiguration(updated));
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
      }

      if (request.operation === OPERATION_SET_ACTIVE_REVISION) {
        if (typeof request?.setActiveRevision !== 'number') {
          throw new InvalidOperationError(`Set active revision request must include setActiveRevision property.`);
        }
        const revisions = await configuration.getRevisions(1, null, { revision: request.setActiveRevision });
        const results = revisions.results;
        const currentRevision = results[0];
        if (!currentRevision) {
          throw new InvalidOperationError(`The selected revision does not exist`);
        }

        const oldRevision = await configuration.getActiveRevision();
        const active = await configuration.setActiveRevision(user, currentRevision.revision);

        end();
        res.send(mapActiveRevision(configuration, active));
        eventService.send(
          activeRevisionSet(
            user,
            configuration.tenantId,
            configuration.namespace,
            configuration.name,
            active,
            oldRevision
          )
        );

        logger.info(
          `Active revision ${configuration.namespace}:${configuration.name}:${active} changed to revision ${currentRevision.revision}` +
            ` by ${user.name} (ID: ${user.id}).`,
          {
            tenant: configuration.tenantId?.toString(),
            context: 'configuration-router',
            user: `${user.name} (ID: ${user.id})`,
          }
        );
      }
    } catch (err) {
      next(err);
    }
  };

export const getRevisions =
  (
    getCriteria = (_req: Request) => ({}),
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
  const router = Router();

  const validateNamespaceNameHandler = createValidationHandler(
    ...checkSchema(
      {
        namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
        name: { isString: true, isLength: { options: { min: 1, max: 50 } } },
      },
      ['params']
    )
  );

  router.get(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    getConfigurationEntity(serviceId, configurationRepository, false, (req) => req.query.core !== undefined),
    getConfigurationWithActive()
  );

  router.get(
    '/configuration/:namespace/:name/latest',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    getConfigurationEntity(serviceId, configurationRepository, false, (req) => req.query.core !== undefined),
    getConfiguration((configuration) => configuration.latest?.configuration || {})
  );

  router.patch(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    createValidationHandler(body('operation').isString().isIn([OPERATION_DELETE, OPERATION_UPDATE, OPERATION_REPLACE])),
    getConfigurationEntity(serviceId, configurationRepository),
    patchConfigurationRevision(logger, eventService)
  );

  router.post(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    createValidationHandler(
      body('operation').isString().isIn([OPERATION_SET_ACTIVE_REVISION, OPERATION_CREATE_REVISION])
    ),
    getConfigurationEntity(serviceId, configurationRepository),
    configurationOperations(logger, eventService)
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
        })
    ),
    getConfigurationEntity(serviceId, configurationRepository, false),
    getRevisions()
  );

  router.get(
    '/configuration/:namespace/:name/active',
    assertAuthenticatedHandler,
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
    getConfigurationEntity(serviceId, configurationRepository, false),
    getActiveRevision(logger)
  );

  router.get(
    '/configuration/:namespace/:name/revisions/:revision',
    assertAuthenticatedHandler,
    createValidationHandler(
      ...checkSchema(
        {
          namespace: { isString: true, isLength: { options: { min: 1, max: 50 } } },
          name: { isString: true, isLength: { options: { min: 1, max: 50 } } },
          revision: { isInt: { options: { min: 0 } } },
        },
        ['params']
      )
    ),
    getConfigurationEntity(serviceId, configurationRepository, false),
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
