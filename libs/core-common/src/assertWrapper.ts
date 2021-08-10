import { assertAuthenticatedHandler } from './assert';
import { RequestHandler } from 'express';

export const AuthAssert = {
  assertMethod: function (req, res, next): RequestHandler {
    return assertAuthenticatedHandler(req, res, next);
  },
};
