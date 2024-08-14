import { AdspId, TokenProvider, getContextTrace } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';
import * as proxy from 'express-http-proxy';
import * as path from 'path';
import { Logger } from 'winston';

interface RouterOptions {
  logger: Logger;
  tokenProvider: TokenProvider;
  configurationApiUrl: URL;
  fileUrl: URL;
}

async function getFile(
  fileUrl: URL,
  tokenProvider: TokenProvider,
  criteria: string,
  tenantId: AdspId
): Promise<string> {
  const token = await tokenProvider.getAccessToken();
  const encodedCriteria = encodeURIComponent(criteria);
  const targetPath = fileUrl.toString() + '/files' + `?criteria=${encodedCriteria}` + `&tenantId=${tenantId}`;
  const result = await axios.get(targetPath, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const fileId = result.data.results[0]?.id;
  return fileId;
}

export function findFile(fileUrl: URL, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const { criteria }: { criteria?: string } = req.query;
      const fileId = await getFile(fileUrl, tokenProvider, criteria, req.tenant?.id);
      res.send({ fileId: fileId });
    } catch (err) {
      next(err);
    }
  };
}

export function downloadFile(fileUrl: URL, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const token = await tokenProvider.getAccessToken();
      const { criteria }: { criteria?: string } = req.query;
      const fileId = await getFile(fileUrl, tokenProvider, criteria, req.tenant?.id);
      const downloadPath = fileUrl.toString() + `/files/${fileId}/download` + `?unsafe=true`;

      return proxy(new URL('', fileUrl).href, {
        async proxyReqOptDecorator(opts) {
          opts.headers.Authorization = `Bearer ${token}`;
          const trace = getContextTrace();
          if (trace) {
            opts.headers['traceparent'] = trace.toString();
          }
          return opts;
        },
        proxyReqPathResolver() {
          return downloadPath;
        },
      })(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

export function createGatewayRouter({ tokenProvider, configurationApiUrl, fileUrl }: RouterOptions): Router {
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
  router.get('/file/v1/download', assertAuthenticatedHandler, downloadFile(fileUrl, tokenProvider));
  router.get('/file/v1/file', assertAuthenticatedHandler, findFile(fileUrl, tokenProvider));

  return router;
}
