import { AuthenticationConfig, authenticateToken } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import type { RequestHandler } from 'express';

const fileServiceAdminRole = 'file-service-admin';
export const fileServiceAdminMiddleware: RequestHandler = async (req, res, next: () => void) => {
  const authConfig: AuthenticationConfig = {
    allowedRoles: [fileServiceAdminRole],
  };

  if (authenticateToken(authConfig, req.user)) {
    next();
  } else {
    res.sendStatus(HttpStatusCodes.UNAUTHORIZED);
  }
};
