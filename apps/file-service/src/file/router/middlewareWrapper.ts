import { RequestHandler } from 'express';

export const MiddlewareWrapper = {
  middlewareMethod: function (req, res, next): RequestHandler {
    return next();
  },
};
