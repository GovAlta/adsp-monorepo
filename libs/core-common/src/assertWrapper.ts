import { assertAuthenticatedHandler } from './assert';
import { RequestHandler } from 'express';

export const AuthAssert = {
  assertMethod: function (req, res, next): RequestHandler {
    // TODO: find the right type for keycloak
    //return next();
    console.log('mock xxx2');
    return assertAuthenticatedHandler(req, res, next);
  },
};
