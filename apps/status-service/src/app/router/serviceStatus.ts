import { AdspId, ServiceDirectory, TokenProvider, User } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  InvalidValueError,
  NotFoundError,
  UnauthorizedError,
} from '@core-services/core-common';
import { Router, RequestHandler } from 'express';
import { Logger } from 'winston';
import { ApplicationConfiguration, EndpointStatusEntryEntity } from '../model';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { PublicServiceStatusType } from '../types';
import { TenantService, EventService, ConfigurationService } from '@abgov/adsp-service-sdk';
import { applicationStatusToStarted, applicationStatusToStopped, applicationStatusChange } from '../events';
import { ApplicationRepo } from './ApplicationRepo';
import { WebhookRepo } from './WebhookRepo';
import { monitoredServiceDown, monitoredServiceUp } from '../events';

export interface ServiceStatusRouterProps {
  logger: Logger;
  tenantService: TenantService;
  eventService: EventService;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  tokenProvider: TokenProvider;
  directory: ServiceDirectory;
  serviceId: AdspId;
  configurationService: ConfigurationService;
}

function mapEndpointStatusEntry(entity: EndpointStatusEntryEntity) {
  return entity
    ? {
        ok: entity.ok,
        timestamp: entity.timestamp,
        responseTime: entity.responseTime,
        status: entity.status,
        applicationId: entity.applicationId,
        url: entity.url,
        appKey: entity.applicationId,
      }
    : null;
}

export const getApplications = (logger: Logger, applicationRepo: ApplicationRepo): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { tenantId } = req.user as User;
      if (!tenantId) {
        throw new UnauthorizedError('missing tenant id');
      }
      const apps = await applicationRepo.getTenantApps(tenantId);
      const statuses = await applicationRepo.findAllStatuses(apps, tenantId.toString());
      const result = apps.map((app) => {
        const status = statuses.find((s) => s.appKey == app.appKey) || null;
        return applicationRepo.mergeApplicationData(tenantId.toString(), app, status);
      });

      res.json(result);
    } catch (err) {
      logger.error(`Failed to fetch applications: ${err.message}`);
      next(err);
    }
  };
};

export const enableApplication =
  (logger: Logger, applicationRepo: ApplicationRepo): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(req.method, req.url);
      const user = req.user as User;
      const { appKey } = req.params;
      const app = await applicationRepo.getApp(appKey, user.tenantId);
      if (!app) {
        throw new NotFoundError('Status application', appKey);
      }

      const appStatus = await applicationRepo.getStatus(user, appKey);
      const updatedApplication = await appStatus.enable({ ...req.user } as User);
      res.json(applicationRepo.mergeApplicationData(user.tenantId.toString(), app, updatedApplication));
    } catch (err) {
      logger.error(`Failed to enable application: ${err.message}`);
      next(err);
    }
  };

export const disableApplication =
  (logger: Logger, applicationRepo: ApplicationRepo): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(req.method, req.url);
      const user = req.user as User;
      const { appKey } = req.params;

      const app = await applicationRepo.getApp(appKey, user.tenantId);
      if (!app) {
        throw new NotFoundError('Status application', appKey);
      }

      const appStatus = await applicationRepo.getStatus(user, appKey);
      const updatedApplication = await appStatus.disable({ ...req.user } as User);
      res.json(applicationRepo.mergeApplicationData(user.tenantId.toString(), app, updatedApplication));
    } catch (err) {
      logger.error(`Failed to disable application: ${err.message}`);
      next(err);
    }
  };

export const createNewApplication =
  (logger: Logger, applicationRepo: ApplicationRepo, tenantService: TenantService): RequestHandler =>
  async (req, res, next) => {
    const user = req.user as User;
    const tenant = await tenantService.getTenant(user.tenantId);
    const { name, description, endpoint, appKey, monitorOnly, status } = req.body;

    try {
      const newAppKey = appKey ? appKey : ApplicationRepo.getApplicationKey(name);
      const existing = await applicationRepo.getTenantApps(tenant.id);
      existing.forEach((a) => {
        if (a.appKey == newAppKey || a.name == name) {
          throw new InvalidValueError('status-service', `Duplicate Application Name ${name}`);
        }
      });

      const newApp = await applicationRepo.createApp(
        newAppKey,
        name,
        description,
        endpoint.url,
        monitorOnly,
        status,
        tenant,
        user
      );
      res.status(201).json(newApp);
    } catch (err) {
      logger.error(`Failed to create new application: ${err.message}`);
      next(err);
    }
  };

export const updateApplication =
  (logger: Logger, applicationRepo: ApplicationRepo): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(`${req.method} - ${req.url}`);

      const user = req.user as User;
      const { name, description, endpoint, monitorOnly, autoChangeStatus } = req.body;
      const { appKey } = req.params;
      const tenantId = user.tenantId?.toString() ?? '';

      if (!tenantId) {
        throw new UnauthorizedError('missing tenant id');
      }
      const app = await applicationRepo.getApp(appKey, user.tenantId);
      if (!app) {
        throw new NotFoundError('Status application', appKey);
      }

      const update: ApplicationConfiguration = {
        appKey,
        name,
        url: endpoint.url,
        description,
        monitorOnly,
        autoChangeStatus,
      };
      await applicationRepo.updateApp(update, tenantId);

      const status = await applicationRepo.findStatus(appKey);

      res.json(applicationRepo.mergeApplicationData(tenantId, update, status));
    } catch (err) {
      logger.error(`Failed to update application: ${err.message}`);
      next(err);
    }
  };

export const deleteApplication =
  (logger: Logger, applicationRepo: ApplicationRepo, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user as User;
      const { appKey } = req.params;
      const app = await applicationRepo.getApp(appKey, user.tenantId);
      if (!app) {
        throw new NotFoundError('Status application', appKey);
      }
      const status = await applicationRepo.findStatus(appKey);

      // Stop health checks if necessary.  Note, there is a lag
      // between requesting the stop and having the service
      // actually stop pinging the Application.  This is because the stop
      // is implemented through the event service, and the uptake time
      // can be O(second).  Unfortunately, this lag can lead to an orphaned Endpoint
      // Status Entry being added to the database AFTER the App has
      // been deleted!
      // TODO One way to mitigate the issue would be to force the user to stop
      // monitoring the app before it can be deleted.
      if (status?.enable) {
        eventService.send(applicationStatusToStopped(app, user));
      }

      applicationRepo.deleteApp(appKey, user);
      res.sendStatus(204);
    } catch (err) {
      logger.error(`Failed to delete application: ${err.message}`);
      next(err);
    }
  };

export const updateApplicationStatus =
  (logger: Logger, applicationRepo: ApplicationRepo, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(`${req.method} - ${req.url}`);

      const user = req.user as User;
      const { appKey } = req.params;
      const { status } = req.body;
      const apps = await applicationRepo.getTenantApps(user.tenantId);

      const app = apps.find(appKey);

      if (!app) {
        throw new NotFoundError('Status Application', appKey);
      }

      const appStatus = await applicationRepo.getStatus(user, appKey);
      const originalStatus = appStatus.status || 'n/a';

      const updatedStatus = await appStatus.setStatus(user, status as PublicServiceStatusType);
      eventService.send(applicationStatusChange(app, status, originalStatus, user));
      res.json(applicationRepo.mergeApplicationData(user.tenantId.toString(), app, updatedStatus));
    } catch (err) {
      logger.error(`Failed to update application: ${err.message}`);
      next(err);
    }
  };

export const toggleApplication =
  (logger: Logger, applicationRepo: ApplicationRepo, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user as User;
      const { appKey } = req.params;

      const app = await applicationRepo.getApp(appKey, user.tenantId);
      if (!app) {
        throw new NotFoundError('Status Application', appKey);
      }

      const appStatus = await applicationRepo.getStatus(user, appKey);
      if (!appStatus.enabled) {
        eventService.send(applicationStatusToStarted(app, user));
      } else {
        eventService.send(applicationStatusToStopped(app, user));
      }

      const updatedApplication = await (appStatus.enabled === true ? appStatus.disable(user) : appStatus.enable(user));
      res.json(applicationRepo.mergeApplicationData(user.tenantId.toString(), app, updatedApplication));
    } catch (err) {
      logger.error(`Failed to toggle application: ${err.message}`);
      next(err);
    }
  };

export const getApplicationEntries =
  (
    logger: Logger,
    applicationRepo: ApplicationRepo,
    endpointStatusEntryRepository: EndpointStatusEntryRepository
  ): RequestHandler =>
  async (req, res, next) => {
    const { tenantId } = req.user as User;
    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    try {
      const { appKey } = req.params;
      const { topValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 200;

      const app = await applicationRepo.getApp(appKey, tenantId);
      if (!app) {
        throw new NotFoundError('Status application', appKey);
      }

      const entries = await endpointStatusEntryRepository.findRecentByUrlAndApplicationId(app.url, app.appKey, top);
      res.send(entries.map(mapEndpointStatusEntry));
    } catch (err) {
      logger.error(`Failed to get application: ${err.message}`);
      next(err);
    }
  };

export const getAllApplicationEntries =
  (logger: Logger, endpointStatusEntryRepository: EndpointStatusEntryRepository): RequestHandler =>
  async (req, res, next) => {
    const { tenantId } = req.user as User;
    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    try {
      const { ageInMinutes } = req.query;
      const minutes = ageInMinutes ? parseInt(ageInMinutes as string) : 31;

      const entries = await endpointStatusEntryRepository.findRecent(minutes);
      res.send(entries.map(mapEndpointStatusEntry));
    } catch (err) {
      logger.error(`Failed: ${err.message}`);
      next(err);
    }
  };

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export const testWebhook =
  (
    logger: Logger,
    webhookRepo: WebhookRepo,
    applicationRepo: ApplicationRepo,
    eventService: EventService
  ): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user as User;
      const { id, eventName } = req.params;

      const webhook = await webhookRepo.getWebhook(id, user.tenantId);
      if (!webhook) {
        throw new NotFoundError('Webhook', id);
      }
      const app = await applicationRepo.getApp(webhook.targetId, user.tenantId);
      if (!app) {
        throw new NotFoundError('Status application', webhook.targetId);
      }

      webhook.generatedByTest = true;

      if (eventName === 'monitored-service-down') {
        eventService.send(monitoredServiceDown(app, user, webhook));
      } else {
        eventService.send(monitoredServiceUp(app, user, webhook));
      }
      await delay(2000);
      res.json(
        `event is sent - app: ${JSON.stringify(app)}, user: ${JSON.stringify(user)}, webhook: ${JSON.stringify(
          webhook
        )}`
      );
    } catch (err) {
      logger.error(`Failed to send event: ${err.message}`);
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
  serviceId,
  configurationService,
}: ServiceStatusRouterProps): Router {
  const router = Router();
  const applicationRepo = new ApplicationRepo(
    serviceStatusRepository,
    endpointStatusEntryRepository,
    serviceId,
    directory,
    tokenProvider,
    configurationService
  );

  const webhookRepo = new WebhookRepo(
    serviceStatusRepository,
    endpointStatusEntryRepository,
    serviceId,
    directory,
    tokenProvider,
    configurationService
  );

  // Get the service for the tenant
  router.get('/applications', assertAuthenticatedHandler, getApplications(logger, applicationRepo));

  // Enable the service
  router.patch('/applications/:appKey/enable', assertAuthenticatedHandler, enableApplication(logger, applicationRepo));

  // Disable the service
  router.patch(
    '/applications/:appKey/disable',
    assertAuthenticatedHandler,
    disableApplication(logger, applicationRepo)
  );
  // add application
  router.post(
    '/applications',
    assertAuthenticatedHandler,
    createNewApplication(logger, applicationRepo, tenantService)
  );
  router.put('/applications/:appKey', assertAuthenticatedHandler, updateApplication(logger, applicationRepo));
  router.delete(
    '/applications/:appKey',
    assertAuthenticatedHandler,
    deleteApplication(logger, applicationRepo, eventService)
  );
  router.patch(
    '/applications/:appKey/status',
    assertAuthenticatedHandler,
    updateApplicationStatus(logger, applicationRepo, eventService)
  );

  router.patch(
    '/applications/:appKey/toggle',
    assertAuthenticatedHandler,
    toggleApplication(logger, applicationRepo, eventService)
  );

  router.get(
    '/applications/:appKey/endpoint-status-entries',
    getApplicationEntries(logger, applicationRepo, endpointStatusEntryRepository)
  );

  router.get('/applications/endpoint-status-entries', getAllApplicationEntries(logger, endpointStatusEntryRepository));

  router.get(
    '/webhook/:id/test/:eventName',
    assertAuthenticatedHandler,
    testWebhook(logger, webhookRepo, applicationRepo, eventService)
  );

  return router;
}
