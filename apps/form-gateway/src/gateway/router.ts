import { AdspId, TenantService, TokenProvider, getContextTrace } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  UnauthorizedError,
} from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';
import * as proxy from 'express-http-proxy';
import { body, query } from 'express-validator';
import { Logger } from 'winston';
import { ServiceRoles, FormServiceRoles } from './roles';
import { FormStatus, FormResponse, SiteVerifyResponse } from './types';
export function verifyCaptcha(logger: Logger, RECAPTCHA_SECRET: string, SCORE_THRESHOLD = 0.5): RequestHandler {
  return async (req, _res, next) => {
    if (!RECAPTCHA_SECRET) {
      next();
    } else {
      try {
        const token = req.body?.token || req.headers?.token;
        const { data } = await axios.post<SiteVerifyResponse>(
          `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`
        );

        if (
          !data.success ||
          !['submit_form', 'submit_form_supporting_doc'].includes(data.action) ||
          data.score < SCORE_THRESHOLD
        ) {
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

export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUUID = (id: string) => {
  return uuidRegex.test(id);
};

async function getFormResponse(
  logger: Logger,
  formApiUrl: URL,
  formUrn: string,
  tenantId: AdspId,
  tokenProvider: TokenProvider
): Promise<FormResponse> {
  const token = await tokenProvider.getAccessToken();
  let formId = '';
  let submissionId = '';

  //eg. urn format when no submission or submission urn provided: urn:ads:platform:form-service:v1:/forms/${formId}
  //eg. urn format with submission: urn:ads:platform:form-service:v1:/forms/${formId}/submissions/${submissionId}
  if (typeof formUrn === 'string' && formUrn.includes('/submissions')) {
    formId = formUrn.split('/')?.at(2) ?? '';
    submissionId = formUrn.split('/')?.at(-1) ?? '';
  } else {
    formId = formUrn.split('/')?.at(-1) ?? '';
  }

  const formResourceUrl = new URL(`v1/forms/${formId}`, formApiUrl);
  try {
    const { data } = await axios.get(formResourceUrl.href, {
      headers: { Authorization: `Bearer ${token}` },
      params: { tenantId: tenantId.toString() },
    });

    let dataResult = data
      ? {
          formDefinitionId: data.definition?.id ?? null,
          id: data.id ?? null,
          status: data.status ?? null,
          submitted: data.submitted ?? null,
          createdBy: {
            ...data.createdBy,
          },
          submission: {
            ...data.submission,
          },
        }
      : null;

    // When the form does have a submission ensure the submission id is correct
    // with the passed in submissionId.  Otherwise we will reject it.
    if (data.submission && submissionId !== '' && data.submission?.id !== submissionId) {
      dataResult = null;
    }

    return dataResult;
  } catch (err) {
    logger.error(`Error trying to retrieve form (ID: ${formId}) Submission (ID: ${submissionId}): ${err.toString()}`);
    return null;
  }
}

async function getFile(
  logger: Logger,
  fileApiUrl: URL,
  tokenProvider: TokenProvider,
  formUrn: string,
  tenantId: AdspId
): Promise<string> {
  const token = await tokenProvider.getAccessToken();

  const criteria = `{ "recordIdContains" : "${formUrn}", "top" : "1" }`;
  const result = await axios.get(new URL(`v1/files`, fileApiUrl).href, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      criteria: criteria,
      tenantId: tenantId.toString(),
    },
  });

  const fileId = result.data.results[0]?.id;
  return fileId;
}

export function canAccessFile(logger: Logger, formResult: FormResponse, user: Express.User) {
  if (formResult === null) return false;

  return (
    formResult?.status === FormStatus.Submitted &&
    formResult?.submitted !== null &&
    formResult?.submission?.id !== null &&
    //Need to check the form gateway roles and form service roles, depending where the request was made.
    //Whether it was from the form app or directly through the form gateway the roles might be different.
    user.roles.find((role) => role.includes(FormServiceRoles.Applicant) || role.includes(ServiceRoles.Applicant)) &&
    user.id === formResult?.createdBy.id
  );
}

export function findFile(
  logger: Logger,
  fileApiUrl: URL,
  formApiUrl: URL,
  tokenProvider: TokenProvider
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { user } = req;
      const { formUrn }: { formUrn?: string } = req.query;

      const formResult = await getFormResponse(logger, formApiUrl, formUrn, req.tenant.id, tokenProvider);

      if (!canAccessFile(logger, formResult, user)) {
        throw new UnauthorizedError(`User not authorized to find file.`);
      }
      const fileId = await getFile(logger, fileApiUrl, tokenProvider, formUrn, req.tenant?.id);
      res.send({ fileId: fileId });
    } catch (err) {
      next(err);
    }
  };
}

export function downloadFile(
  logger: Logger,
  fileApiUrl: URL,
  formApiUrl: URL,
  tokenProvider: TokenProvider
): RequestHandler {
  return async (req, res, next) => {
    try {
      const token = await tokenProvider.getAccessToken();
      const { user } = req;

      const { formUrn }: { formUrn?: string } = req.query;
      const formResult = await getFormResponse(logger, formApiUrl, formUrn, req.tenant.id, tokenProvider);

      if (!canAccessFile(logger, formResult, user)) {
        throw new UnauthorizedError('User not authorized to download file.');
      }

      const fileId = await getFile(logger, fileApiUrl, tokenProvider, formUrn, req.tenant?.id);
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

export function uploadAnonymousFile(logger: Logger, fileApiUrl: URL, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const fileResourceUrl = fileApiUrl.toString() + '/files';

      const token = await tokenProvider.getAccessToken();

      logger.debug(`Submitting form supporting document from anonymous user`, {
        context: 'GatewayRouter',
      });

      return proxy(new URL('', fileApiUrl).href, {
        limit: '5mb',
        async proxyReqOptDecorator(opts) {
          opts.headers.Authorization = `Bearer ${token}`;
          const trace = getContextTrace();
          if (trace) {
            opts.headers['traceparent'] = trace.toString();
          }
          return opts;
        },
        parseReqBody: false,
        proxyReqPathResolver(req) {
          const tenantId = req.query?.tenant;
          logger.debug(`Redirecting form supporting document request from anonymous user`, {
            context: 'GatewayRouter',
            tenant: tenantId,
          });
          return `${fileResourceUrl}?tenantId=${tenantId}`;
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
      const { tenant: tenantName, definitionId, data, files, dryRun } = req.body;

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
        { definitionId, data, files, submit: true, dryRun: dryRun },
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

  router.get(
    '/file/v1/download',
    assertAuthenticatedHandler,
    createValidationHandler(
      query('formUrn')
        .isString()
        .custom(async (value: string) => {
          validateFormUrn(value);
        })
    ),
    downloadFile(logger, fileApiUrl, formApiUrl, tokenProvider)
  );

  router.get(
    '/file/v1/file',
    assertAuthenticatedHandler,
    createValidationHandler(
      query('formUrn')
        .isString()
        .custom(async (value: string) => {
          validateFormUrn(value);
        })
    ),
    findFile(logger, fileApiUrl, formApiUrl, tokenProvider)
  );

  router.post(
    '/files',
    verifyCaptcha(logger, RECAPTCHA_SECRET, 0.7),
    uploadAnonymousFile(logger, fileApiUrl, tokenProvider)
  );

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

export const validateFormUrn = (formUrn: string) => {
  if (formUrn === undefined || (formUrn === '' && typeof formUrn === 'string')) {
    throw new InvalidOperationError('Invalid formUrn.');
  }
  if (
    (typeof formUrn === 'string' && !formUrn.includes('/forms/')) ||
    (typeof formUrn === 'string' && !formUrn.includes('urn:ads:platform:form-service'))
  ) {
    throw new InvalidOperationError('Invalid formUrn.');
  }
};
