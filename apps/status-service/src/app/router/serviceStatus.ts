import { adspId, AdspId, ServiceDirectory, TokenProvider, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Router, RequestHandler } from 'express';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity, StaticApplicationData, StatusServiceConfiguration } from '../model';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { PublicServiceStatusType } from '../types';
import { TenantService, EventService } from '@abgov/adsp-service-sdk';
import { applicationStatusToStarted, applicationStatusToStopped, applicationStatusChange } from '../events';
import axios from 'axios';
import { StatusApplications } from '../model/statusApplications';

export interface ServiceStatusRouterProps {
  logger: Logger;
  tenantService: TenantService;
  eventService: EventService;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  tokenProvider: TokenProvider;
  directory: ServiceDirectory;
}

const mergeApplicationData = (app: StaticApplicationData, status: ServiceStatusApplicationEntity) => {
  return {
    _id: status._id,
    appKey: status.appKey,
    tenantId: status.tenantId,
    name: app.name,
    description: app.description,
    metadata: status.metadata,
    enabled: status.enabled,
    statusTimestamp: status.statusTimestamp,
    status: status.status,
    internalStatus: status.internalStatus,
    endpoint: { status: status.endpoint.status, url: app.url },
    tenantName: status.tenantName,
    tenantRealm: status.tenantRealm,
  };
};

export const getApplications = (logger: Logger, serviceStatusRepository: ServiceStatusRepository): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { tenantId } = req.user as User;
      if (!tenantId) {
        throw new UnauthorizedError('missing tenant id');
      }
      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        tenantId
      );
      const applications = new StatusApplications(configuration);

      const statuses = await serviceStatusRepository.find({ tenantId: tenantId.toString() });

      res.json(
        statuses.map((s) => {
          // Sometimes the configuration cache hasn't refreshed; use a dummy app until it does.
          // The front end will have to account for this.
          const app = applications.get(s._id) ?? {
            _id: s._id,
            appKey: s.appKey,
            name: 'unknown',
            description: '',
            url: '',
          };
          return mergeApplicationData(app, s);
        })
      );
    } catch (err) {
      logger.error(`Failed to fetch applications: ${err.message}`);
      next(err);
    }
  };
};

export const enableApplication =
  (logger: Logger, serviceStatusRepository: ServiceStatusRepository): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(req.method, req.url);
      const user = req.user as User;
      const { id } = req.params;
      const appStatus = await serviceStatusRepository.get(id);
      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        user.tenantId
      );
      const applications = new StatusApplications(configuration);
      const app = applications.get(id);

      if (user.tenantId?.toString() !== appStatus.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }
      const updatedApplication = await appStatus.enable({ ...req.user } as User);
      res.json(mergeApplicationData(app, updatedApplication));
    } catch (err) {
      logger.error(`Failed to enable application: ${err.message}`);
      next(err);
    }
  };

export const disableApplication =
  (logger: Logger, serviceStatusRepository: ServiceStatusRepository): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(req.method, req.url);
      const user = req.user as User;
      const { id } = req.params;
      const appStatus = await serviceStatusRepository.get(id);
      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        user.tenantId
      );
      const applications = new StatusApplications(configuration);
      const app = applications.get(id);

      if (user.tenantId?.toString() !== appStatus.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedApplication = await appStatus.disable({ ...req.user } as User);
      res.json(mergeApplicationData(app, updatedApplication));
    } catch (err) {
      logger.error(`Failed to disable application: ${err.message}`);
      next(err);
    }
  };

export const createNewApplication =
  (
    logger: Logger,
    tenantService: TenantService,
    tokenProvider: TokenProvider,
    serviceDirectory: ServiceDirectory,
    serviceStatusRepository: ServiceStatusRepository
  ): RequestHandler =>
  async (req, res, next) => {
    const user = req.user as User;
    const { name, description, endpoint } = req.body;
    const tenant = await tenantService.getTenant(user.tenantId);

    try {
      const tenantName = tenant.name;
      const tenantRealm = tenant.realm;
      const appKey = getApplicationKey(tenant.name, name);
      const status: ServiceStatusApplicationEntity = await ServiceStatusApplicationEntity.create(
        { ...(req.user as User) },
        serviceStatusRepository,
        {
          appKey: appKey,
          tenantId: tenant.id.toString(),
          tenantName,
          tenantRealm,
          endpoint,
          metadata: '',
          statusTimestamp: 0,
          enabled: false,
        }
      );
      const newApp: StaticApplicationData = {
        _id: status._id,
        appKey: appKey,
        name: name,
        url: endpoint.url,
        description: description,
      };
      updateConfiguration(serviceDirectory, tokenProvider, tenant.id, status._id, newApp);
      res.status(201).json(mergeApplicationData(newApp, status));
    } catch (err) {
      logger.error(`Failed to create new application: ${err.message}`);
      next(err);
    }
  };

// create a unique key that can be used to access the application
// status.  This algorithm assumes that the application name
// will be unique within a tenant context.
const getApplicationKey = (tenantName: string, appName: string): string => {
  return `${toKebabCase(tenantName)}-${toKebabCase(appName)}`;
};

const toKebabCase = (s: string): string => {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

export const updateConfiguration = async (
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  tenantId: AdspId,
  applicationId: string,
  newApp: StaticApplicationData
) => {
  const baseUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
  const token = await tokenProvider.getAccessToken();
  const configUrl = new URL(`/configuration/v2/configuration/platform/status-service?tenantId=${tenantId}`, baseUrl);
  await axios.patch(
    configUrl.href,
    {
      operation: 'UPDATE',
      update: {
        [applicationId]: newApp,
      },
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
};

export const updateApplication =
  (
    logger: Logger,
    tenantService: TenantService,
    tokenProvider: TokenProvider,
    serviceDirectory: ServiceDirectory,
    serviceStatusRepository: ServiceStatusRepository
  ): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(`${req.method} - ${req.url}`);

      const user = req.user as User;
      const { name, description, endpoint } = req.body;
      const { id } = req.params;
      const tenantId = user.tenantId?.toString() ?? '';

      if (!tenantId) {
        throw new UnauthorizedError('missing tenant id');
      }
      const tenant = await tenantService.getTenant(user.tenantId);
      const appKey = getApplicationKey(tenant.name, name);
      const update: StaticApplicationData = { _id: id, appKey, name, url: endpoint.url, description };
      updateConfiguration(serviceDirectory, tokenProvider, user.tenantId, id, update);

      const status = await serviceStatusRepository.get(id);

      res.json(mergeApplicationData(update, status));
    } catch (err) {
      logger.error(`Failed to update application: ${err.message}`);
      next(err);
    }
  };

export const deleteApplication =
  (
    logger: Logger,
    tokenProvider: TokenProvider,
    directory: ServiceDirectory,
    serviceStatusRepository: ServiceStatusRepository
  ): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user as User;
      const { id } = req.params;
      const application = await serviceStatusRepository.get(id);

      if (user.tenantId?.toString() !== application.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      await application.delete({ ...user } as User);
      deleteConfigurationApp(id, directory, tokenProvider, user.tenantId);
      res.sendStatus(204);
    } catch (err) {
      logger.error(`Failed to delete application: ${err.message}`);
      next(err);
    }
  };

const deleteConfigurationApp = async (
  id: string,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  tenantId: AdspId
) => {
  const baseUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
  const token = await tokenProvider.getAccessToken();
  const configUrl = new URL(`/configuration/v2/configuration/platform/status-service?tenantId=${tenantId}`, baseUrl);
  await axios.patch(
    configUrl.href,
    {
      operation: 'DELETE',
      property: id,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
};

export const updateApplicationStatus =
  (logger: Logger, serviceStatusRepository: ServiceStatusRepository, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(`${req.method} - ${req.url}`);

      const user = req.user as User;
      const { id } = req.params;
      const { status } = req.body;
      const applicationStatus = await serviceStatusRepository.get(id);
      const originalStatus = applicationStatus.status ?? 'n/a';
      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        user.tenantId
      );
      const apps = new StatusApplications(configuration);
      const app = apps.get(applicationStatus._id);

      if (user.tenantId?.toString() !== applicationStatus.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedStatus = await applicationStatus.setStatus(user, status as PublicServiceStatusType);
      eventService.send(applicationStatusChange(app, status, originalStatus, user));
      res.json(mergeApplicationData(app, updatedStatus));
    } catch (err) {
      logger.error(`Failed to update application: ${err.message}`);
      next(err);
    }
  };

export const toggleApplication =
  (logger: Logger, serviceStatusRepository: ServiceStatusRepository, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user as User;
      const { id } = req.params;
      const appStatus = await serviceStatusRepository.get(id);

      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        user.tenantId
      );
      const apps = new StatusApplications(configuration);
      const app = apps.get(id);
      if (!appStatus.enabled) {
        eventService.send(applicationStatusToStarted(app, appStatus, user));
      } else {
        eventService.send(applicationStatusToStopped(app, appStatus, user));
      }

      if (user.tenantId?.toString() !== appStatus.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedApplication = await (appStatus.enabled === true ? appStatus.disable(user) : appStatus.enable(user));
      res.json(mergeApplicationData(app, updatedApplication));
    } catch (err) {
      logger.error(`Failed to toggle application: ${err.message}`);
      next(err);
    }
  };

export const getApplicationEntries =
  (
    logger: Logger,
    serviceStatusRepository: ServiceStatusRepository,
    endpointStatusEntryRepository: EndpointStatusEntryRepository
  ): RequestHandler =>
  async (req, res, next) => {
    const { tenantId } = req.user as User;
    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    try {
      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        tenantId
      );
      const applications = new StatusApplications(configuration);
      const { applicationId } = req.params;
      const { topValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 200;

      const app = applications.get(applicationId);
      if (!app) {
        throw new NotFoundError('Status application', applicationId.toString());
      }

      // TODO is there an easier way to test if the tenant is authorized to
      // access this application?  It seems a bit of a waste to hit up
      // the database just for this.
      const appStatus = await serviceStatusRepository.get(applicationId);
      if (tenantId?.toString() !== appStatus.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const entries = await endpointStatusEntryRepository.findRecentByUrlAndApplicationId(app.url, applicationId, top);
      res.send(
        entries.map((e) => {
          return {
            ...e,
            url: app.url,
          };
        })
      );
    } catch (err) {
      logger.error(`Failed to get application: ${err.message}`);
      next(err);
    }
  };

export function createServiceStatusRouter({
  logger,
  serviceStatusRepository,
  tenantService,
  eventService,
  endpointStatusEntryRepository,
  tokenProvider,
  directory,
}: ServiceStatusRouterProps): Router {
  const router = Router();
  // Get the service for the tenant
  router.get('/applications', assertAuthenticatedHandler, getApplications(logger, serviceStatusRepository));

  // Enable the service
  router.patch(
    '/applications/:id/enable',
    assertAuthenticatedHandler,
    enableApplication(logger, serviceStatusRepository)
  );

  // Disable the service
  router.patch(
    '/applications/:id/disable',
    assertAuthenticatedHandler,
    disableApplication(logger, serviceStatusRepository)
  );
  // add application
  router.post(
    '/applications',
    assertAuthenticatedHandler,
    createNewApplication(logger, tenantService, tokenProvider, directory, serviceStatusRepository)
  );
  router.put(
    '/applications/:id',
    assertAuthenticatedHandler,
    updateApplication(logger, tenantService, tokenProvider, directory, serviceStatusRepository)
  );
  router.delete(
    '/applications/:id',
    assertAuthenticatedHandler,
    deleteApplication(logger, tokenProvider, directory, serviceStatusRepository)
  );
  router.patch(
    '/applications/:id/status',
    assertAuthenticatedHandler,
    updateApplicationStatus(logger, serviceStatusRepository, eventService)
  );

  router.patch(
    '/applications/:id/toggle',
    assertAuthenticatedHandler,
    toggleApplication(logger, serviceStatusRepository, eventService)
  );

  router.get(
    '/applications/:applicationId/endpoint-status-entries',
    getApplicationEntries(logger, serviceStatusRepository, endpointStatusEntryRepository)
  );

  return router;
}
