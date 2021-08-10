import { assertAuthenticatedHandler } from './assert';
import { RequestHandler } from 'express';

export const TenantWrapper = {
  tenantMethod: function (): RequestHandler {
    return assertAuthenticatedHandler(req, res, next);
  },
};
