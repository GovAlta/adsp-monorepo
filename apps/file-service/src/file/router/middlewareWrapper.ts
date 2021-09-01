import { RequestHandler } from 'express';

export const MiddlewareWrapper = {
  // eslint-disable-next-line
  middlewareMethod: function (req, res, next): RequestHandler {
    return next();
  },
};
