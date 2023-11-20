import { ServiceDirectory, benchmark } from '@abgov/adsp-service-sdk';
import { NotFoundError, InvalidOperationError, assertAuthenticatedHandler } from '@core-services/core-common';
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import * as proxy from 'express-http-proxy';

import { TokenHandlerConfiguration } from '../configuration';
import { csrfHandler } from '../csrf';
import { UserSessionData } from '../types';

const proxyHandlers: Record<string, RequestHandler> = {};
export async function getProxyHandler(
  config: TokenHandlerConfiguration,
  directory: ServiceDirectory,
  targetId: string
) {
  const target = config.getTarget(targetId);
  if (!target) {
    throw new NotFoundError('target', targetId);
  }

  let proxyHandler = proxyHandlers[targetId];
  if (!proxyHandler) {
    const upstreamUrl = await directory.getServiceUrl(target.upstream);
    if (!upstreamUrl) {
      throw new InvalidOperationError(
        `Target (ID: ${targetId}) upstream ${target.upstream} cannot be resolved by the service directory. Did you register the service or API?`
      );
    }

    proxyHandler = proxy(new URL('', upstreamUrl).href, {
      proxyReqOptDecorator: async function (opts, req) {
        const { accessToken, exp, authenticatedBy } = req.user as UserSessionData;

        // If access token is within 60 seconds of expiring, then refresh it.
        if (exp * 1000 - Date.now() < 60000) {
          const client = config.getClient(authenticatedBy);
          const accessToken = await client.refreshTokens(req);
          opts.headers.Authorization = `Bearer ${accessToken}`;
        } else {
          opts.headers.Authorization = `Bearer ${accessToken}`;
        }

        return opts;
      },
      proxyReqPathResolver: function (req) {
        const [_, ...relative] = req.url.split(target.id);
        const targetUrl = new URL(relative.join(target.id), upstreamUrl);

        return targetUrl.pathname;
      },
    });

    this.proxyHandlers[targetId] = proxyHandler;
  }

  return proxyHandler;
}

export function proxyRequest(directory: ServiceDirectory): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const [config] = await req.getConfiguration<TokenHandlerConfiguration>();
      const handler = await getProxyHandler(config, directory, id);
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
  directory: ServiceDirectory;
}

export function createTargetRouter({ configurationHandler, directory }: RouterOptions) {
  const router = Router();

  router.use('/targets/:id', assertAuthenticatedHandler, csrfHandler, configurationHandler, proxyRequest(directory));

  return router;
}
