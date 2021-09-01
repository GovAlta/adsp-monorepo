import { RequestHandler, Request, Response, NextFunction } from 'express';
import { fileServiceAdminMiddleware } from './authentication';

export const AuthenticationWrapper = {
  authenticationMethod: function (req: Request, res: Response, next: NextFunction): RequestHandler | void {
    return fileServiceAdminMiddleware(req, res, next);
  },
};
