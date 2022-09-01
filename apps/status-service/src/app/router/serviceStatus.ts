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
import { config } from 'dotenv';

export interface ServiceStatusRouterProps {
  logger: Logger;
  tenantService: TenantService;
  eventService: EventService;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  tokenProvider: TokenProvider;
  directory: ServiceDirectory;
}

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
          return {
            ...s,
            internalStatus: s.internalStatus,
            name: app?.name || 'unknown',
            description: app?.description || '',
            endpoint: { ...s.endpoint, url: app?.url || '' },
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
      const app: ServiceStatusApplicationEntity = await ServiceStatusApplicationEntity.create(
        { ...(req.user as User) },
        serviceStatusRepository,
        {
          name,
          description,
          tenantId: tenant.id.toString(),
          tenantName,
          tenantRealm,
          endpoint,
          metadata: '',
          statusTimestamp: 0,
          enabled: false,
        }
      );
      const newApp: StaticApplicationData = { name: name, url: endpoint.url, description: description };
      updateConfiguration(serviceDirectory, tokenProvider, tenant.id, app._id, newApp);
      res.status(201).json(app);
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
      const application = await serviceStatusRepository.get(id);
      if (tenantId !== application.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedApplication = await application.update({ ...user } as User, {
        name,
        description,
        endpoint,
      });
      const update: StaticApplicationData = { name: name, url: endpoint.url, description: description };
      updateConfiguration(serviceDirectory, tokenProvider, user.tenantId, id, update);
      res.json({
        ...updatedApplication,
        internalStatus: updatedApplication.internalStatus,
      });
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
      const application = await serviceStatusRepository.get(id);
      const applicationStatus = application.status;

      if (user.tenantId?.toString() !== application.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedApplication = await application.setStatus(user, status as PublicServiceStatusType);
      eventService.send(applicationStatusChange(updatedApplication, applicationStatus, user));
      res.json({
        ...updatedApplication,
        internalStatus: updatedApplication.internalStatus,
      });
    } catch (err) {
      logger.error(`Failed to update application: ${err.message}`);
      next(err);
    }
  };

export const toggleApplication =
  (logger: Logger, serviceStatusRepository: ServiceStatusRepository, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(`${req.method} - ${req.url}`);

      const user = req.user as User;
      const { id } = req.params;
      const application = await serviceStatusRepository.get(id);

      if (!application.enabled) {
        eventService.send(applicationStatusToStarted(application, user));
      } else {
        eventService.send(applicationStatusToStopped(application, user));
      }

      if (user.tenantId?.toString() !== application.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedApplication = application.enabled ? await application.disable(user) : await application.enable(user);
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
