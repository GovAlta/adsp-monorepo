import { RequestHandler } from 'express';
// Passport enhances type defs on express types; this is needed for type checking on tests.
import * as _passport from 'passport';
import { logger } from './logger';

export const assertAuthenticatedHandler: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated || !req.user) {
    res.sendStatus(401);
  } else {
    next();
  }
};

export interface AuthenticationConfig {
  requireCore?: boolean;
  allowedRoles?: Array<string>;
}

export const authenticateToken = (authConfig: AuthenticationConfig, user) => {
  logger.debug(`Checking access for user ${user.name} (${user.id}) via tenant: ${user.tenantId || 'core'}`);

  try {
    if (authConfig.requireCore) {
      if (!user.isCore) {
        logger.warn(`Expect core tenant, but access token is not for core.`);
        return false;
      }
    }

    if (authConfig.allowedRoles) {
      let hasRole = false;
      for (const role of authConfig.allowedRoles) {
        if (user.roles.includes(role)) {
          hasRole = true;
          break;
        }
      }
      if (!hasRole) {
        logger.warn(`Expect client with role ${authConfig.allowedRoles}, but none of them are found.`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
