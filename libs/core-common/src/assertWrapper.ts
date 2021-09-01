import { assertAuthenticatedHandler } from './assert';
import { RequestHandler, Request, Response, NextFunction } from 'express';

export const AuthAssert = {
  assertMethod: function (req: Request, res: Response, next: NextFunction): RequestHandler | void {
    return assertAuthenticatedHandler(req, res, next);
  },
};
