import { AuthenticationConfig, authenticateToken } from '@core-services/core-common';
import type { RequestHandler } from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import { TenantServiceRoles } from '../roles';

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
    allowedRoles: [TenantServiceRoles.TenantServiceAdmin, TenantServiceRoles.BetaTester] ,
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

export const requirePlatformService: RequestHandler = (req, res, next) => {
  const authConfig: AuthenticationConfig = {
    requireCore: true,
    allowedRoles: [TenantServiceRoles.PlatformService],
  };

  if (authenticateToken(authConfig, req.user)) {
    next();
  } else {
    res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
  }
};
