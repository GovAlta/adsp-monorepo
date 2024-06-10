import { TokenProvider, getContextTrace } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import { Router } from 'express';
import * as proxy from 'express-http-proxy';
import * as path from 'path';
import { Logger } from 'winston';

interface RouterOptions {
  logger: Logger;
  tokenProvider: TokenProvider;
  configurationApiUrl: URL;
}

export function createGatewayRouter({ tokenProvider, configurationApiUrl }: RouterOptions): Router {
  const router = Router();

  router.get(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    proxy(new URL('', configurationApiUrl).href, {
      async proxyReqOptDecorator(opts) {
        const token = await tokenProvider.getAccessToken();
        opts.headers.Authorization = `Bearer ${token}`;

        const trace = getContextTrace();
        if (trace) {
          opts.headers['traceparent'] = trace.toString();
        }

        return opts;
      },
      proxyReqPathResolver(req) {
        const targetPath = path.join(
          configurationApiUrl.pathname,
          req.originalUrl.substring('/gateway/v1'.length),
          `/active?orLatest=true&tenantId=${req.tenant.id}`
        );
        return targetPath;
      },
    })
  );

  return router;
}
