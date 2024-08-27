import { AdspId, TenantService, TokenProvider, getContextTrace } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  NotFoundError,
  UnauthorizedError,
} from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';
import * as proxy from 'express-http-proxy';
import { body } from 'express-validator';
import { Logger } from 'winston';

interface SiteVerifyResponse {
  success: boolean;
  score: number;
  action: string;
}

export function verifyCaptcha(logger: Logger, RECAPTCHA_SECRET: string, SCORE_THRESHOLD = 0.5): RequestHandler {
  return async (req, _res, next) => {
    if (!RECAPTCHA_SECRET) {
      next();
    } else {
      try {
        const { token } = req.body;
        const { data } = await axios.post<SiteVerifyResponse>(
          `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`
        );

        if (!data.success || !['submit_form'].includes(data.action) || data.score < SCORE_THRESHOLD) {
          logger.warn(
            `Captcha verification failed for form gateway with result '${data.success}' on action '${data.action}' with score ${data.score}.`,
            { context: 'GatewayRouter' }
          );

          throw new UnauthorizedError('Request rejected because captcha verification not successful.');
        }

        next();
      } catch (err) {
        next(err);
      }
    }
  };
}

async function getFile(
  fileApiUrl: URL,
  tokenProvider: TokenProvider,
  criteria: string,
  tenantId: AdspId
): Promise<string> {
  const token = await tokenProvider.getAccessToken();
  const encodedCriteria = encodeURIComponent(criteria);
  const targetPath = fileApiUrl.toString() + '/files' + `?criteria=${encodedCriteria}` + `&tenantId=${tenantId}`;
  const result = await axios.get(targetPath, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const fileId = result.data.results[0]?.id;
  return fileId;
}

export function findFile(fileApiUrl: URL, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const { criteria }: { criteria?: string } = req.query;
      const fileId = await getFile(fileApiUrl, tokenProvider, criteria, req.tenant?.id);
      res.send({ fileId: fileId });
    } catch (err) {
      next(err);
    }
  };
}

export function downloadFile(fileApiUrl: URL, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const token = await tokenProvider.getAccessToken();
      const { criteria }: { criteria?: string } = req.query;
      const fileId = await getFile(fileApiUrl, tokenProvider, criteria, req.tenant?.id);
      const downloadPath = fileApiUrl.toString() + `/files/${fileId}/download` + `?unsafe=true`;

      return proxy(new URL('', fileApiUrl).href, {
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

export function submitSimpleForm(
  logger: Logger,
  formApiUrl: URL,
  tokenProvider: TokenProvider,
  tenantService: TenantService
): RequestHandler {
  const formsResourceUrl = new URL('v1/forms', formApiUrl);
  return async (req, res, next) => {
    try {
      const { tenant: tenantName, definitionId, data, files } = req.body;

      const tenant = await tenantService.getTenantByName(tenantName?.replace(/-/g, ' '));
      if (!tenant) {
        throw new NotFoundError('tenant', 'tenantName');
      }

      logger.debug(`Submitting simple form based on definition (ID: ${definitionId})...`, {
        context: 'GatewayRouter',
        tenant: tenant.id.toString(),
      });

      const token = await tokenProvider.getAccessToken();
      const { data: responseData } = await axios.post<{ id: string }>(
        formsResourceUrl.href,
        { definitionId, data, files, submit: true },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenant.id.toString() },
        }
      );

      res.send(responseData);

      logger.info(
        `Submitted simple form based on definition (ID: ${definitionId}) with result form ID: ${responseData.id}`,
        {
          context: 'GatewayRouter',
          tenant: tenant.id.toString(),
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

interface RouterOptions {
  logger: Logger;
  tokenProvider: TokenProvider;
  tenantService: TenantService;
  fileApiUrl: URL;
  formApiUrl: URL;
  RECAPTCHA_SECRET?: string;
}

export function createGatewayRouter({
  logger,
  tokenProvider,
  tenantService,
  fileApiUrl,
  formApiUrl,
  RECAPTCHA_SECRET,
}: RouterOptions): Router {
  const router = Router();

  router.get('/file/v1/download', assertAuthenticatedHandler, downloadFile(fileApiUrl, tokenProvider));
  router.get('/file/v1/file', assertAuthenticatedHandler, findFile(fileApiUrl, tokenProvider));

  router.post(
    '/forms',
    verifyCaptcha(logger, RECAPTCHA_SECRET, 0.7),
    createValidationHandler(
      body('tenant').isString().isLength({ min: 1, max: 50 }),
      body('definitionId').isString().isLength({ min: 1, max: 50 }),
      body('data').isObject(),
      body('files').optional().isObject()
    ),
    submitSimpleForm(logger, formApiUrl, tokenProvider, tenantService)
  );

  return router;
}
