import type { User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { InvalidParamsError, UnauthorizedError } from '../common/errors';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ServiceStatusType } from '../types';

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
    const { name, description, timeIntervalMin, endpoints, metadata } = req.body;
    const tenantId = user.tenantId?.toString() ?? '';

    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    const app = await ServiceStatusApplicationEntity.create({ ...(req.user as User) }, serviceStatusRepository, {
      name,
      description,
      tenantId,
      timeIntervalMin,
      endpoints,
      metadata,
      statusTimestamp: 0,
      status: 'disabled',
    });
    res.status(201).json(app);
  });

  router.put('/applications/:id', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const user = req.user as Express.User;
    const { name, description, timeIntervalMin, endpoints } = req.body;
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
      timeIntervalMin,
      endpoints,
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

  router.patch('/applications/:id/status', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const user = req.user as Express.User;
    const { id } = req.params;
    const { status } = req.body;
    const application = await serviceStatusRepository.get(id);

    if (user.tenantId?.toString() !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    const updatedApplication = await application.setStatus(user, status as ServiceStatusType);
    res.status(200).json(updatedApplication);
  });

  return router;
}
