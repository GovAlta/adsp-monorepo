import { RequestHandler } from 'express';
import { fileServiceAdminMiddleware } from './authentication';

export const AuthenticationWrapper = {
  authenticationMethod: function (req, res, next): RequestHandler {
    // TODO: find the right type for keycloak
    //return next();
    return fileServiceAdminMiddleware(req, res, next);
  },
};
