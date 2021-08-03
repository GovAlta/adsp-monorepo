import { RequestHandler } from 'express';

export const MiddlewareWrapper = {
  middlewareMethod: function (req, res, next): RequestHandler {
    // TODO: find the right type for keycloak
    //return next();
    console.log('mock xxxxxx');
    return next();
  },
};
