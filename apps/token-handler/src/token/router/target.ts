import { benchmark } from '@abgov/adsp-service-sdk';
import { NotFoundError, assertAuthenticatedHandler } from '@core-services/core-common';
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';

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
      benchmark(req, 'proxy-request-time');
      handler(req, res, () => {
        benchmark(req, 'proxy-request-time');
        next();
      });
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

  router.all('/targets/:id/*', assertAuthenticatedHandler, csrfHandler, configurationHandler, proxyRequest());

  return router;
}
