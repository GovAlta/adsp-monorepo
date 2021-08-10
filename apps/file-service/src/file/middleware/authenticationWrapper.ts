import { RequestHandler } from 'express';
import { fileServiceAdminMiddleware } from './authentication';

export const AuthenticationWrapper = {
  authenticationMethod: function (req, res, next): RequestHandler {
    return fileServiceAdminMiddleware(req, res, next);
  },
};
