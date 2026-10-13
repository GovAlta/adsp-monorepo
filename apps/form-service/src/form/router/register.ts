import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createValidationHandler, InvalidOperationError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { body, param } from 'express-validator';
import * as HttpStatusCodes from 'http-status-codes';
import { Logger } from 'winston';
import { DataRegisterClient } from '../dataRegisterClient';
import { ConfigurationServiceRoles, FormServiceRoles } from '../roles';
import { DataRegisterCreateRequest, DataRegisterUpdateRequest } from '../types/register';

// 1 to 50 letters, digits, hyphens, underscores and spaces, not starting or ending with a space, so a name can't be
// blank and ' weekdays' can't exist alongside 'weekdays'.
export const REGISTER_NAME_PATTERN = /^[a-zA-Z0-9-_](?:[a-zA-Z0-9-_ ]{0,48}[a-zA-Z0-9-_])?$/;

const getRequiredTenantId = (req: Parameters<RequestHandler>[0]): AdspId => {
  if (!req.tenant?.id) {
    throw new InvalidOperationError('Tenant context is required for operation.');
  }
  return req.tenant.id;
};

const assertCanManageRegisters = (user: User, tenantId: AdspId, operation: string): void => {
  if (!isAllowedUser(user, tenantId, [FormServiceRoles.Admin, ConfigurationServiceRoles.ConfigurationAdmin], true)) {
    throw new UnauthorizedUserError(operation, user);
  }
};

const logRegisterAction = (logger: Logger, action: string, name: string, tenantId: AdspId, user: User): void => {
  logger.info(`Data register '${name}' ${action} by ${user.name} (ID: ${user.id}).`, {
    context: 'register-router',
    tenant: tenantId.toString(),
    user: `${user.name} (ID: ${user.id})`,
  });
};

export function findRegisters(client: DataRegisterClient): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      assertCanManageRegisters(req.user, tenantId, 'find data registers');

      const registers = await client.find(tenantId);
      res.send(registers);
    } catch (err) {
      next(err);
    }
  };
}

export function getRegister(client: DataRegisterClient): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      assertCanManageRegisters(req.user, tenantId, 'get data register');

      const register = await client.get(tenantId, req.params.name);
      res.send(register);
    } catch (err) {
      next(err);
    }
  };
}

export function createRegister(client: DataRegisterClient, logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      const user = req.user;
      assertCanManageRegisters(user, tenantId, 'create data register');

      const register = await client.create(tenantId, req.body as DataRegisterCreateRequest);
      res.status(HttpStatusCodes.CREATED).send(register);
      logRegisterAction(logger, 'created', register.name, tenantId, user);
    } catch (err) {
      next(err);
    }
  };
}

export function updateRegister(client: DataRegisterClient, logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      const user = req.user;
      assertCanManageRegisters(user, tenantId, 'update data register');

      const { name } = req.params;
      const register = await client.update(tenantId, name, req.body as DataRegisterUpdateRequest);
      res.send(register);
      logRegisterAction(logger, 'updated', name, tenantId, user);
    } catch (err) {
      next(err);
    }
  };
}

export function deleteRegister(client: DataRegisterClient, logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = getRequiredTenantId(req);
      const user = req.user;
      assertCanManageRegisters(user, tenantId, 'delete data register');

      const { name } = req.params;
      await client.delete(tenantId, name);
      res.sendStatus(HttpStatusCodes.NO_CONTENT);
      logRegisterAction(logger, 'deleted', name, tenantId, user);
    } catch (err) {
      next(err);
    }
  };
}

const isEntry = (entry: unknown): boolean =>
  typeof entry === 'string' || (typeof entry === 'object' && entry !== null && !Array.isArray(entry));

const validateEntries = body('entries')
  .optional()
  .isArray()
  .withMessage('entries must be an array')
  .bail()
  .custom((entries: unknown[]) => entries.every(isEntry))
  .withMessage('entries must be strings or objects');

interface RegisterRouterProps {
  client: DataRegisterClient;
  logger: Logger;
}

export function createRegisterRouter({ client, logger }: RegisterRouterProps): Router {
  const router = Router();

  const validateNameParam = param('name').isString().matches(REGISTER_NAME_PATTERN);

  router.get('/registers', assertAuthenticatedHandler, findRegisters(client));

  router.get(
    '/registers/:name',
    assertAuthenticatedHandler,
    createValidationHandler(validateNameParam),
    getRegister(client),
  );

  router.post(
    '/registers',
    assertAuthenticatedHandler,
    createValidationHandler(
      body('name').exists().withMessage('name is required').bail().isString().matches(REGISTER_NAME_PATTERN),
      body('description').optional().isString(),
      validateEntries,
    ),
    createRegister(client, logger),
  );

  router.patch(
    '/registers/:name',
    assertAuthenticatedHandler,
    createValidationHandler(validateNameParam, body('description').optional().isString(), validateEntries),
    updateRegister(client, logger),
  );

  router.delete(
    '/registers/:name',
    assertAuthenticatedHandler,
    createValidationHandler(validateNameParam),
    deleteRegister(client, logger),
  );

  return router;
}
