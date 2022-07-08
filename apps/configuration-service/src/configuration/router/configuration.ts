import { AdspId, benchmark, EventService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  Results,
} from '@core-services/core-common';
import { Request, RequestHandler, Router } from 'express';
import { body, checkSchema, query } from 'express-validator';
import { isEqual as isDeepEqual } from 'lodash';
import { Logger } from 'winston';
import { configurationUpdated, revisionCreated, activeRevisionSet } from '../events';
import { ConfigurationEntity } from '../model';
import { ConfigurationRepository, Repositories } from '../repository';
import { ConfigurationDefinition, ConfigurationDefinitions, ConfigurationRevision } from '../types';
import { OPERATION_DELETE, OPERATION_REPLACE, OPERATION_UPDATE, PatchRequests } from './types';

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

export const getConfigurationEntity =
  (
    configurationServiceId: AdspId,
    repository: ConfigurationRepository,
    requestCore = (_req: Request): boolean => false
  ): RequestHandler =>
  async (req, _res, next) => {
    try {
      benchmark(req, 'get-entity-time');

      const user = req.user;
      const { namespace, name } = req.params;
      const getCore = requestCore(req);
      const tenantId = req.tenant?.id;

      console.log(JSON.stringify(tenantId) + '<---xx');

      const definition = await getDefinition(configurationServiceId, repository, namespace, name, tenantId);

      const entity = await repository.get(namespace, name, getCore ? null : tenantId, definition?.configurationSchema);
      if (!entity.canAccess(user)) {
        throw new UnauthorizedUserError('access configuration', user);
      }

      req[ENTITY_KEY] = entity;
      benchmark(req, 'get-entity-time');
      next();
    } catch (err) {
      next(err);
    }
  };

const mapConfiguration = (configuration: ConfigurationEntity): unknown => ({
  namespace: configuration.namespace,
  name: configuration.name,
  latest: configuration.latest,
  active: configuration.active,
});

export const getConfiguration =
  (mapResult = mapConfiguration): RequestHandler =>
  async (req, res) => {
    const configuration: ConfigurationEntity = req[ENTITY_KEY];
    res.send(mapResult(configuration));
  };

export const patchConfigurationRevision =
  (logger: Logger, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      benchmark(req, 'operation-handler-time');

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
          update = { ...entity.latest?.configuration };
          updateData = request.property;
          delete update[request.property];
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

        benchmark(req, 'operation-handler-time');
        res.send(mapConfiguration(entity));
      } else {
        const updated = await entity.update(user, update);

        benchmark(req, 'operation-handler-time');
        res.send(mapConfiguration(updated));
        if (updated.tenantId) {
          eventService.send(
            configurationUpdated(user, updated.tenantId, updated.namespace, updated.name, updated.latest?.revision, {
              operation: request.operation,
              data: updateData,
            })
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

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export const getActiveRevision =
  (logger: Logger, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      benchmark(req, 'operation-handler-time');

      const user = req.user;
      const configuration: ConfigurationEntity = req[ENTITY_KEY];

      const activeRevision = configuration.active;

      if (!activeRevision) {
        throw new NotFoundError('Active Revision');
      }

      res.send(activeRevision);

      logger.info(`Active revision ${activeRevision.revision} ` + `retrieved by ${user.name} (ID: ${user.id}).`, {
        tenant: configuration.tenantId?.toString(),
        context: 'configuration-router',
        user: `${user.name} (ID: ${user.id})`,
      });

      benchmark(req, 'operation-handler-time');
    } catch (err) {
      next(err);
    }
  };

export const createConfigurationRevision =
  (logger: Logger, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      benchmark(req, 'operation-handler-time');

      const user = req.user;
      console.log(JSON.stringify(user, getCircularReplacer()) + '<user--');
      const { revision = false, setRevision } = req.body;
      console.log(JSON.stringify(setRevision, getCircularReplacer()) + '<setRevision--');
      if (!revision && !setRevision) {
        throw new InvalidOperationError('Request operation not recognized.');
      } else if (setRevision) {
        const configuration: ConfigurationEntity = req[ENTITY_KEY];
        console.log(JSON.stringify(configuration, getCircularReplacer()) + '<configurationx--');
        const revisions = await configuration.getRevisions();
        console.log(JSON.stringify(revisions) + '<revisions--xx');
        console.log(JSON.stringify(revisions.results) + '<revisions--xx.results');
        const results = revisions.results;
        const currentRevision = results.find((rev) => {
          console.log(JSON.stringify(rev) + '<rev');
          console.log(JSON.stringify(rev.revision) + '<rev.revision');
          return rev.revision === setRevision;
        });

        if (!currentRevision) {
          throw new InvalidOperationError(`The selected revision does not exist`);
        }
        console.log(JSON.stringify(revisions) + '<revisions--');
        console.log(JSON.stringify(currentRevision) + '<currentRevision--');
        console.log(JSON.stringify(configuration.active) + '<-configuration.active0');
        console.log(JSON.stringify(configuration.latest) + '<-configuration.latest0');
        const lastRevision = configuration.active?.revision || configuration.latest?.revision;
        const updated = await configuration.setActiveRevision(user, currentRevision, configuration.latest);
        const getRevisions = await configuration.getRevisions();
        console.log(JSON.stringify(getRevisions) + '<----');
        console.log(JSON.stringify(configuration.active) + '<-configuration.active');
        console.log(JSON.stringify(configuration.latest) + '<-configuration.latest');
        console.log(JSON.stringify(lastRevision) + '<-lastRevision');

        res.send(mapConfiguration(updated));
        eventService.send(
          activeRevisionSet(
            user,
            updated.tenantId,
            updated.namespace,
            updated.name,
            updated.latest?.revision,
            lastRevision
          )
        );

        logger.info(
          `Active revision ${updated.namespace}:${updated.name}:${updated.latest?.revision} changed to revision ${currentRevision.revision}` +
            ` by ${user.name} (ID: ${user.id}).`,
          {
            tenant: updated.tenantId?.toString(),
            context: 'configuration-router',
            user: `${user.name} (ID: ${user.id})`,
          }
        );
      } else {
        const configuration: ConfigurationEntity = req[ENTITY_KEY];
        const updated = await configuration.createRevision(user);
        console.log(JSON.stringify(updated, getCircularReplacer()) + '<updated--');
        benchmark(req, 'operation-handler-time');
        res.send(mapConfiguration(updated));
        if (updated.tenantId) {
          eventService.send(
            revisionCreated(user, updated.tenantId, updated.namespace, updated.name, updated.latest?.revision)
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
      benchmark(req, 'operation-handler-time');
      const { top: topValue, after: afterValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const after = afterValue as string;
      const criteria = getCriteria(req);

      const entity: ConfigurationEntity = req[ENTITY_KEY];
      const results = await entity.getRevisions(top, after, criteria);

      benchmark(req, 'operation-handler-time');
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
    getConfigurationEntity(serviceId, configurationRepository, (req) => req.query.core !== undefined),
    getConfiguration()
  );

  router.get(
    '/configuration/:namespace/:name/latest',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    getConfigurationEntity(serviceId, configurationRepository, (req) => req.query.core !== undefined),
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
    createValidationHandler(body('revision').isBoolean()),
    getConfigurationEntity(serviceId, configurationRepository),
    createConfigurationRevision(logger, eventService)
  );

  router.get(
    '/configuration/:namespace/:name/revisions',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    createValidationHandler(query('top').optional().isInt({ min: 1, max: 5000 }), query('after').optional().isString()),
    getConfigurationEntity(serviceId, configurationRepository),
    getRevisions()
  );

  router.get(
    '/configuration/:namespace/:name/active',
    assertAuthenticatedHandler,
    validateNamespaceNameHandler,
    createValidationHandler(query('top').optional().isInt({ min: 1, max: 5000 }), query('after').optional().isString()),
    getConfigurationEntity(serviceId, configurationRepository),
    getActiveRevision(logger, eventService)
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
    getConfigurationEntity(serviceId, configurationRepository),
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
