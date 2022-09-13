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
import { ApplicationCache } from './ApplicationCache';

export interface ServiceStatusRouterProps {
  logger: Logger;
  tenantService: TenantService;
  eventService: EventService;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  tokenProvider: TokenProvider;
  directory: ServiceDirectory;
}

const applicationCache = new ApplicationCache();

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
          const app = applications.get(s._id);
          const { metadata, statusTimestamp, tenantId, tenantName, tenantRealm, status, enabled } = s;
          Object.keys(s.endpoint).map((endpoint) => {
            const currentEndpoint = JSON.parse(JSON.stringify(s.endpoint[endpoint]));
            delete currentEndpoint._id;
            if (currentEndpoint) {
              s.endpoint[endpoint] = currentEndpoint;
            }
          });
          // Use the applicationCache for cases where a new or updated application
          // has been saved, but the configuration-service cache has not yet updated.
          // This should be relatively infrequent, but it occurs often enough.
          return {
            _id: s._id,
            tenantId,
            name: app?.name || applicationCache.get(s._id)?.name || 'unknown',
            description: app?.description || applicationCache.get(s._id)?.description || '',
            metadata,
            enabled: enabled,
            statusTimestamp,
            status,
            internalStatus: s.internalStatus,
            endpoint: { ...s.endpoint, url: app?.url || applicationCache.get(s._id)?.url || '' },
            tenantName,
            tenantRealm,
          };
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
      const application = await serviceStatusRepository.get(id);

      if (user.tenantId?.toString() !== application.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }
      const updatedApplication = await application.enable({ ...req.user } as User);
      res.json(updatedApplication);
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
      const application = await serviceStatusRepository.get(id);

      if (user.tenantId?.toString() !== application.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedApplication = await application.disable({ ...req.user } as User);
      res.json(updatedApplication);
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
      const status: ServiceStatusApplicationEntity = await ServiceStatusApplicationEntity.create(
        { ...(req.user as User) },
        serviceStatusRepository,
        {
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
        name: name,
        url: endpoint.url,
        description: description,
      };
      updateConfiguration(serviceDirectory, tokenProvider, tenant.id, status._id, newApp);
      res.status(201).json(status);
    } catch (err) {
      logger.error(`Failed to create new application: ${err.message}`);
      next(err);
    }
  };

export const updateConfiguration = async (
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  tenantId: AdspId,
  applicationId: string,
  newApp: StaticApplicationData
) => {
  applicationCache.put(applicationId, newApp);
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

      // TODO: this needs to be moved to a service
      const applicationStatus = await serviceStatusRepository.get(id);
      if (tenantId !== applicationStatus.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedApplication = await applicationStatus.update({ ...user } as User, {
        endpoint,
      });
      const update: StaticApplicationData = { _id: id, name: name, url: endpoint.url, description: description };
      updateConfiguration(serviceDirectory, tokenProvider, user.tenantId, id, update);
      res.json(updatedApplication);
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
      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        user.tenantId
      );
      const apps = new StatusApplications(configuration);
      const app = apps.get(applicationStatus._id);

      if (user.tenantId?.toString() !== applicationStatus.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedStatus = await applicationStatus.setStatus(user, status as PublicServiceStatusType);
      eventService.send(applicationStatusChange(app, status, applicationStatus.status, user));
      res.json(updatedStatus);
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
      const status = await serviceStatusRepository.get(id);

      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        user.tenantId
      );
      const apps = new StatusApplications(configuration);
      if (!status.enabled) {
        eventService.send(applicationStatusToStarted(apps.get(id), status, user));
      } else {
        eventService.send(applicationStatusToStopped(apps.get(id), status, user));
      }

      if (user.tenantId?.toString() !== status.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedApplication = status.enabled ? await status.disable(user) : await status.enable(user);
      res.json(updatedApplication);
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
  router.get('/applications', getApplications(logger, serviceStatusRepository));

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
    updateApplication(logger, tokenProvider, directory, serviceStatusRepository)
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
