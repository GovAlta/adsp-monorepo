import { AuthenticationConfig, authenticateToken } from '@core-services/core-common';
import type { RequestHandler } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { TenantServiceRoles } from '../roles';
import { TenantService } from '@abgov/adsp-service-sdk';
import { UnauthorizedError } from '@core-services/core-common';

export const requireTenantServiceAdmin: RequestHandler = async (req, res, next: () => void) => {
  const authConfig: AuthenticationConfig = {
    requireCore: true,
    allowedRoles: [TenantServiceRoles.TenantServiceAdmin],
  };

  if (authenticateToken(authConfig, req.user)) {
    next();
  } else {
    res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
  }
};

export const requireBetaTesterOrAdmin: RequestHandler = async (req, res, next: () => void) => {
  const authConfig: AuthenticationConfig = {
    requireCore: true,
    allowedRoles: [TenantServiceRoles.TenantServiceAdmin, TenantServiceRoles.BetaTester],
  };

  if (authenticateToken(authConfig, req.user)) {
    next();
  } else {
    res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
  }
};

export const requireTenantAdmin: RequestHandler = async (req, res, next: () => void) => {
  const authConfig: AuthenticationConfig = {
    requireCore: false,
    allowedRoles: [TenantServiceRoles.TenantAdmin],
  };

  if (authenticateToken(authConfig, req.user)) {
    next();
  } else {
    res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
  }
};

export const requireDirectoryAdmin: RequestHandler = async (req, res, next: () => void) => {
  const authConfig: AuthenticationConfig = {
    requireCore: true,
    allowedRoles: [TenantServiceRoles.DirectoryAdmin],
  };

  if (authenticateToken(authConfig, req.user)) {
    next();
  } else {
    res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
  }
};

// Copied toKebabName from frontend. Might need to move to lib if necessary
export const toKebabName = (tenantName: string): string => {
  return tenantName.toLowerCase().replace(/ /g, '-');
};

export const validateNamespaceEndpointsPermission =
  (tenantService: TenantService): RequestHandler =>
  async (req, res, next) => {
    const roles = req.user.roles;
    try {
      if (!roles.includes(TenantServiceRoles.DirectoryAdmin)) {
        throw new UnauthorizedError('Missing roles');
      }
      const tenant = await tenantService.getTenant(req.user?.tenantId);

      if (!tenant) {
        throw new UnauthorizedError();
      } else {
        /**
         * Notice, please do not use the tenant.namespace here
         * This middleware can be only applied to path has parameter 'namespace'
         * */
        const isNamespaceMatch = toKebabName(tenant.name) === req.params?.namespace;
        if (isNamespaceMatch) {
          next();
        } else {
          throw new UnauthorizedError('Wrong namespace?');
        }
      }
    } catch (err) {
      next(err);
    }
  };
