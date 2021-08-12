import { AdspId, adspId, EventService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, InvalidOperationError } from '@core-services/core-common';
import { Request, RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { configurationUpdated, revisionCreated } from '../events';
import { ServiceConfigurationEntity } from '../model';
import { ConfigurationRepository, Repositories } from '../repository';
import { ConfigurationDefinition, ConfigurationDefinitions } from '../types';
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
  serviceId: AdspId,
  tenantId?: AdspId
): Promise<ConfigurationDefinition> => {
  const key = serviceId.toString();
  const core = await repository.get<ConfigurationDefinitions>(configurationServiceId);
  if (core?.latest?.configuration[key]) {
    return core.latest.configuration[key];
  } else if (tenantId) {
    const tenant = await repository.get<ConfigurationDefinitions>(configurationServiceId, tenantId);
    return tenant?.latest?.configuration[key];
  } else {
    return null;
  }
};

export const getServiceConfigurationEntity = (
  configurationServiceId: AdspId,
  repository: ConfigurationRepository,
  requestCore = (_req: Request): boolean => false
): RequestHandler => async (req, _res, next) => {
  const user = req.user;
  const { namespace, service } = req.params;
  const { tenantId: tenantIdValue } = req.query;
  const getCore = requestCore(req);

  try {
    const tenantId = user?.isCore && tenantIdValue ? AdspId.parse(tenantIdValue as string) : user.tenantId;

    const serviceId = adspId`urn:ads:${namespace}:${service}`;
    const definition = await getDefinition(configurationServiceId, repository, serviceId, tenantId);

    const entity = await repository.get(serviceId, getCore ? null : tenantId, definition?.configurationSchema);
    if (!entity.canAccess(user)) {
      throw new UnauthorizedUserError('access configuration', user);
    }

    req[ENTITY_KEY] = entity;
    next();
  } catch (err) {
    next(err);
  }
};

const mapConfiguration = (configuration: ServiceConfigurationEntity): unknown => ({
  serviceId: configuration.serviceId.toString(),
  latest: configuration.latest,
});

export const getServiceConfiguration = (mapResult = mapConfiguration): RequestHandler => async (req, res) => {
  const configuration: ServiceConfigurationEntity = req[ENTITY_KEY];
  res.send(mapResult(configuration));
};

export const patchServiceConfigurationRevision = (eventService: EventService): RequestHandler => async (
  req,
  res,
  next
) => {
  const user = req.user;
  const request: PatchRequests = req.body;

  try {
    const entity: ServiceConfigurationEntity = req[ENTITY_KEY];

    let update: Record<string, unknown> = null;
    switch (request.operation) {
      case OPERATION_REPLACE:
        if (!request.configuration) {
          throw new InvalidOperationError(`Replace request must include 'configuration' property.`);
        }
        update = request.configuration;
        break;
      case OPERATION_UPDATE:
        if (!request.update) {
          throw new InvalidOperationError(`Update request must include 'update' property.`);
        }
        update = {
          ...(entity.latest?.configuration || {}),
          ...request.update,
        };
        break;
      case OPERATION_DELETE:
        if (!request.property) {
          throw new InvalidOperationError(`Delete request must include 'property' property.`);
        }
        update = entity.latest?.configuration || {};
        delete update[request.property];
        break;
      default:
        throw new InvalidOperationError('Request does not include recognized operation.');
    }
    const updated = await entity.update(user, update);

    res.send(mapConfiguration(updated));
    if (updated.tenantId) {
      eventService.send(configurationUpdated(updated.tenantId, updated.serviceId, updated.latest?.revision));
    }
  } catch (err) {
    next(err);
  }
};

export const createServiceConfigurationRevision = (eventService: EventService): RequestHandler => async (
  req,
  res,
  next
) => {
  const user = req.user;
  const { revision = false } = req.body;
  if (!revision) {
    next(new InvalidOperationError('Request operation not recognized.'));
    return;
  }

  try {
    const configuration: ServiceConfigurationEntity = req[ENTITY_KEY];
    const updated = await configuration.createRevision(user);

    res.send(mapConfiguration(updated));
    if (updated.tenantId) {
      eventService.send(revisionCreated(updated.tenantId, updated.serviceId, updated.latest?.revision));
    }
  } catch (err) {
    next(err);
  }
};

export function createConfigurationRouter({
  serviceId,
  eventService,
  configuration: configurationRepository,
}: ConfigurationRouterProps): Router {
  const router = Router();

  router.get(
    '/configuration/:namespace/:service',
    assertAuthenticatedHandler,
    getServiceConfigurationEntity(serviceId, configurationRepository, (req) => req.query.core !== undefined),
    getServiceConfiguration()
  );

  router.get(
    '/configuration/:namespace/:service/latest',
    assertAuthenticatedHandler,
    getServiceConfigurationEntity(serviceId, configurationRepository),
    getServiceConfiguration((configuration) => configuration.latest?.configuration)
  );

  router.patch(
    '/configuration/:namespace/:service',
    assertAuthenticatedHandler,
    getServiceConfigurationEntity(serviceId, configurationRepository),
    patchServiceConfigurationRevision(eventService)
  );

  router.post(
    '/configuration/:namespace/:service',
    assertAuthenticatedHandler,
    getServiceConfigurationEntity(serviceId, configurationRepository),
    createServiceConfigurationRevision(eventService)
  );

  return router;
}
