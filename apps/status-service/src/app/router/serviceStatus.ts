import { assertAuthenticatedHandler, UnauthorizedError, User } from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusRepository } from '../repository/serviceStatus';

export interface ServiceStatusRouterProps {
  logger: Logger;
  serviceStatusRepository: ServiceStatusRepository;
}

export function createServiceStatusRouter({ logger, serviceStatusRepository }: ServiceStatusRouterProps): Router {
  const router = Router();

  // Get the service for the tenant
  router.get('/applications', assertAuthenticatedHandler, async (req, res) => {
    logger.info(req.method, req.url);
    const { tenantId } = req.user;
    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    const applications = await serviceStatusRepository.find({ tenantId: tenantId.toString() });
    res.json(applications);
  });

  // Enable the service
  router.patch('/applications/:id/enable', assertAuthenticatedHandler, async (req, res) => {
    logger.info(req.method, req.url);
    const user = req.user as Express.User;
    const { id } = req.params;
    const application = await serviceStatusRepository.get(id);

    if (user.tenantId?.toString() !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    const updatedApplication = await application.enable({ ...req.user } as User);
    res.json(updatedApplication);
  });

  // Disable the service
  router.patch('/applications/:id/disable', assertAuthenticatedHandler, async (req, res) => {
    logger.info(req.method, req.url);
    const user = req.user;
    const { id } = req.params;
    const application = await serviceStatusRepository.get(id);

    if (user.tenantId?.toString() !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    const updatedApplication = await application.disable({ ...req.user } as User);
    res.json(updatedApplication);
  });

  // add application
  router.post('/applications', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const user = req.user;
    const { enabled, name, timeIntervalMin, endpoints, metadata } = req.body;
    const tenantId = user.tenantId?.toString() ?? '';

    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    const app = await ServiceStatusApplicationEntity.create({ ...(req.user as User) }, serviceStatusRepository, {
      name,
      tenantId,
      timeIntervalMin,
      endpoints,
      enabled,
      metadata,
      statusTimestamp: 0,
    });
    res.status(201).json(app);
  });

  router.put('/applications/:id', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const user = req.user as Express.User;
    const { enabled, name, timeIntervalMin, endpoints } = req.body;
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
      timeIntervalMin,
      endpoints,
      enabled,
    });
    res.status(200).json(updatedApplication);
  });

  router.delete('/applications/:id', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const user = req.user as Express.User;
    const { id } = req.params;
    const application = await serviceStatusRepository.get(id);

    if (user.tenantId?.toString() !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    await application.delete({ ...user } as User);

    res.sendStatus(204);
  });

  return router;
}
