import { NotFoundError, assertAuthenticatedHandler, createValidationHandler } from '@core-services/core-common';
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { param } from 'express-validator';

import { TokenHandlerConfiguration } from '../configuration';
import { csrfHandler } from '../csrf';

export function proxyRequest(): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const [config] = await req.getConfiguration<TokenHandlerConfiguration>();
      const target = config.getTarget(id);
      if (!target) {
        throw new NotFoundError('target', id);
      }

      const handler = await target.getProxyHandler();
      handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

interface RouterOptions {
  configurationHandler: RequestHandler;
}

export function createTargetRouter({ configurationHandler }: RouterOptions) {
  const router = Router();

  router.all(
    '/targets/:id/*',
    assertAuthenticatedHandler,
    csrfHandler,
    createValidationHandler(param('id').isString().isLength({ min: 1, max: 50 })),
    configurationHandler,
    proxyRequest()
  );

  return router;
}
