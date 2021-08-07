import { assertAuthenticatedHandler } from './assert';
import { RequestHandler } from 'express';

export const TenantWrapper = {
  tenantMethod: function (): RequestHandler {
    // TODO: find the right type for keycloak
    //return next();
    console.log('mock xxx1');
    return assertAuthenticatedHandler(req, res, next);
  },
};
