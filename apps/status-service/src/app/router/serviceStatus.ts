import { AdspId, ServiceDirectory, TokenProvider, User } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  InvalidValueError,
  NotFoundError,
  UnauthorizedError,
} from '@core-services/core-common';
import { Router, RequestHandler } from 'express';
import { Logger } from 'winston';
import { StaticApplicationData } from '../model';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { PublicServiceStatusType } from '../types';
import { TenantService, EventService } from '@abgov/adsp-service-sdk';
import { applicationStatusToStarted, applicationStatusToStopped, applicationStatusChange } from '../events';
import { ApplicationRepo } from './ApplicationRepo';

export interface ServiceStatusRouterProps {
  logger: Logger;
  tenantService: TenantService;
  eventService: EventService;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  tokenProvider: TokenProvider;
  directory: ServiceDirectory;
  serviceId: AdspId;
}

export const getApplications = (logger: Logger, applicationRepo: ApplicationRepo): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { tenantId } = req.user as User;
      if (!tenantId) {
        throw new UnauthorizedError('missing tenant id');
      }
      const applications = await applicationRepo.getTenantApps(tenantId);
      const statuses = await applicationRepo.getTenantStatuses(tenantId);
      const result = applications.map((app) => {
        const status = statuses.find((s) => s.appKey == app.appKey) || null;
        return applicationRepo.mergeApplicationData(app, status);
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

      if (user.tenantId?.toString() !== app.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const appStatus = await applicationRepo.getStatus(user, appKey);
      const updatedApplication = await appStatus.enable({ ...req.user } as User);
      res.json(applicationRepo.mergeApplicationData(app, updatedApplication));
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

      if (user.tenantId?.toString() !== app.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const appStatus = await applicationRepo.getStatus(user, appKey);
      const updatedApplication = await appStatus.disable({ ...req.user } as User);
      res.json(applicationRepo.mergeApplicationData(app, updatedApplication));
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
    const { name, description, endpoint } = req.body;

    try {
      const appKey = ApplicationRepo.getApplicationKey(tenant.name, name);
      const existing = await applicationRepo.getTenantApps(tenant.id);
      existing.forEach((a) => {
        if (a.appKey == appKey || a.name == name) {
          throw new InvalidValueError('status-service', `Duplicate Application Name ${name}`);
        }
      });

      const newApp = await applicationRepo.createApp(name, description, endpoint.url, tenant);
      res.status(201).json(newApp);
    } catch (err) {
      logger.error(`Failed to create new application: ${err.message}`);
      next(err);
    }
  };

export const updateApplication =
  (logger: Logger, applicationRepo: ApplicationRepo, tenantService: TenantService): RequestHandler =>
  async (req, res, next) => {
    try {
      logger.info(`${req.method} - ${req.url}`);

      const user = req.user as User;
      const { name, description, endpoint } = req.body;
      const { appKey } = req.params;
      const tenantId = user.tenantId?.toString() ?? '';

      if (!tenantId) {
        throw new UnauthorizedError('missing tenant id');
      }
      const tenant = await tenantService.getTenant(user.tenantId);
      const app = await applicationRepo.getApp(appKey, user.tenantId);
      if (!app) {
        throw new NotFoundError('Status application', appKey);
      }

      const update: StaticApplicationData = {
        _id: app._id,
        appKey,
        name,
        url: endpoint.url,
        description,
        tenantId,
        tenantName: tenant.name,
        tenantRealm: tenant.realm,
      };
      await applicationRepo.updateApp(update);

      const status = await applicationRepo.findStatus(appKey);

      res.json(applicationRepo.mergeApplicationData(update, status));
    } catch (err) {
      logger.error(`Failed to update application: ${err.message}`);
      next(err);
    }
  };

export const deleteApplication =
  (logger: Logger, applicationRepo: ApplicationRepo): RequestHandler =>
  async (req, res, next) => {
    try {
      const user = req.user as User;
      const { appKey } = req.params;
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
      const originalStatus = appStatus.status;

      if (user.tenantId?.toString() !== app.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedStatus = await appStatus.setStatus(user, status as PublicServiceStatusType);
      eventService.send(applicationStatusChange(app, status, originalStatus, user));
      res.json(applicationRepo.mergeApplicationData(app, updatedStatus));
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

      if (user.tenantId?.toString() !== app.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const updatedApplication = await (appStatus.enabled === true ? appStatus.disable(user) : appStatus.enable(user));
      res.json(applicationRepo.mergeApplicationData(app, updatedApplication));
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

      if (tenantId?.toString() !== app.tenantId) {
        throw new UnauthorizedError('invalid tenant id');
      }

      const entries = await endpointStatusEntryRepository.findRecentByUrlAndApplicationId(app.url, app.appKey, top);
      res.send(
        entries.map((e) => {
          return {
            ...e,
            url: app.url,
            appKey: appKey,
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
  serviceId,
}: ServiceStatusRouterProps): Router {
  const router = Router();
  const applicationRepo = new ApplicationRepo(serviceStatusRepository, serviceId, directory, tokenProvider);

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
  router.put(
    '/applications/:appKey',
    assertAuthenticatedHandler,
    updateApplication(logger, applicationRepo, tenantService)
  );
  router.delete('/applications/:appKey', assertAuthenticatedHandler, deleteApplication(logger, applicationRepo));
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

  return router;
}
