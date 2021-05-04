import { AuthenticationConfig, authenticateToken } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';

export const adminOnlyMiddleware = async (req, res, next: () => void) => {
  const authConfig: AuthenticationConfig = {
    tenantName: 'core',
    client: 'tenant-api',
  };

  if (authenticateToken(authConfig, req.user)) {
    next();
  } else {
    res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
  }
};

export const tenantInitOnlyMiddleware = async (req, res, next: () => void) => {
  const authConfig: AuthenticationConfig = {
    tenantName: 'core',
    client: 'tenant-platform-webapp',
  };

  if (authenticateToken(authConfig, req.user)) {
    next();
  } else {
    res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
  }
};
