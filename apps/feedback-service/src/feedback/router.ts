import { AdspId, Tenant, TenantService, UnauthorizedUserError, User, isAllowedUser } from '@abgov/adsp-service-sdk';
import {
  InvalidOperationError,
  UnauthorizedError,
  WorkQueueService,
  createValidationHandler,
} from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { RateLimitRequestHandler, rateLimit } from 'express-rate-limit';
import { checkSchema } from 'express-validator';
import { readFile } from 'fs/promises';
import * as hasha from 'hasha';
import { Logger } from 'winston';
import { FeedbackConfiguration } from './configuration';
import { FeedbackWorkItem } from './job';
import { ServiceRoles } from './roles';
import { Feedback } from './types';
import { ReadQueryParameters, ValueService } from './value';
import { FeedbackSiteService } from './feedbackSiteService';

export function resolveFeedbackContext(
  tenantService: TenantService,
  rateLimitHandler: RateLimitRequestHandler
): RequestHandler {
  return async function (req, res, next) {
    try {
      // If no tenant context is set by the SDK handler (which uses user tenant context), then resolve from request body.
      const { tenant: tenantValue } = req.body || {};
      if (!req.tenant && tenantValue) {
        req.tenant = AdspId.isAdspId(tenantValue)
          ? await tenantService.getTenant(AdspId.parse(tenantValue))
          : await tenantService.getTenantByName(tenantValue.replace('-', ' '));
      }

      if (!req.tenant) {
        throw new InvalidOperationError('Tenant context is required.');
      }

      // If authenticated, verify that the user is permitted to send feedback.
      // This is to support service accounts that might send feedback on behalf of users.
      const user = req.user;
      if (user) {
        if (!isAllowedUser(user, req.tenant.id, ServiceRoles.FeedbackProvider)) {
          throw new UnauthorizedUserError('provide feedback', user);
        }

        next();
      } else {
        // If anonymous, then apply rate limiting.
        rateLimitHandler(req, res, next);
      }
    } catch (err) {
      next(err);
    }
  };
}

export function sendFeedback(logger: Logger, queueService: WorkQueueService<FeedbackWorkItem>): RequestHandler {
  return async function (req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const user = req.user;
      const { context, rating, comment, technicalIssue } = req.body as Feedback;

      const { sites } = await req.getConfiguration<FeedbackConfiguration, FeedbackConfiguration>(tenantId);
      const siteConfiguration = sites[context.site];
      if (!siteConfiguration) {
        throw new InvalidOperationError('Site configuration for feedback context not found.');
      }

      if (!siteConfiguration.allowAnonymous && !user) {
        throw new UnauthorizedError(`Site ${siteConfiguration.url} requires user context for feedback.`);
      }

      // If views is set, then validate that the view is in site configuration.
      if (siteConfiguration.views && !siteConfiguration.views.find(({ path }) => path === context.view)) {
        throw new InvalidOperationError(`Site '${context.site}' view '${context.view}' not recognized.`);
      }

      const feedback = {
        context,
        rating: rating.toString(),
        comment,
        technicalIssue,
      };
      // Hash the content for duplicate detection later.
      // Perform this here so the impact is on the producer side of the job queue.
      const digest = hasha(JSON.stringify(feedback), { algorithm: 'sha256' });

      await queueService.enqueue({
        tenantId: tenantId.toString(),
        timestamp: new Date().toISOString(),
        digest,
        feedback,
      });

      logger.info(`Received and queued feedback on '${context.site}${context.view}' for processing.`, {
        context: 'FeedbackRouter',
        tenant: tenantId.toString(),
      });

      res.json({ sent: true });
    } catch (err) {
      next(err);
    }
  };
}

const canRead = (user: User, tenant: Tenant, role: ServiceRoles) => {
  return isAllowedUser(user, tenant.id, role, true);
};

export const readValues =
  (valueService: ValueService): RequestHandler =>
  async (req, res, next) => {
    try {
      if (!req.tenant) {
        throw new InvalidOperationError('Tenant is required.');
      }
      if (!canRead(req.user, req.tenant, ServiceRoles.FeedbackReader)) {
        throw new UnauthorizedError('User is not authorized to read feedback.');
      }
      if (!req.query?.site) {
        throw new InvalidOperationError('Site is required.');
      }
      const queryParameters: ReadQueryParameters = {
        site: req.query.site as string,
        top: req.query?.top ? parseInt(req.query.top as string, 10) : 10,
        after: req.query?.after ? (req.query.after as string) : undefined,
        start: req.query?.start ? (req.query.start as string) : undefined,
        end: req.query?.end ? (req.query.end as string) : undefined,
      };
      const values = await valueService.readValues(req.tenant.id, queryParameters);
      res.json(values);
    } catch (err) {
      next(err);
    }
  };

export const getSites =
  (feedbackSiteService: FeedbackSiteService, tenantService: TenantService): RequestHandler =>
  async (req, res, next) => {
    try {
      if (!canRead(req.user, req.tenant, ServiceRoles.FeedbackReader)) {
        throw new UnauthorizedError('User not authorized to read feedback.');
      }
      const tenantName = (req.query?.tenant as string) || null;
      const doCount = req.query?.count === 'true';
      if (tenantName && doCount) {
        const tenant = await tenantService.getTenantByName(tenantName.replace('-', ' '));
        if (tenant) {
          const sites = await feedbackSiteService.countTenantSites([tenant.id]);
          res.json(sites);
          return;
        } else {
          throw new InvalidOperationError(`Tenant '${tenantName}' not found.`);
        }
      } else if (tenantName) {
        const tenant = await tenantService.getTenantByName(tenantName.replace('-', ' '));
        if (tenant) {
          const sites = await feedbackSiteService.getTenantSites([tenant.id]);
          res.json(sites);
          return;
        } else {
          throw new InvalidOperationError(`Tenant '${tenantName}' not found.`);
        }
      } else if (doCount) {
        const count = await feedbackSiteService.countAllSites();
        res.json({ count });
        return;
      } else {
        const sites = await feedbackSiteService.getAllSites();
        res.json(sites);
        return;
      }
    } catch (err) {
      next(err);
    }
  };

interface WidgetInformation {
  script: string;
  length: number;
  integrity: string;
}

let widget: WidgetInformation = null;
async function loadWidgetInformation(): Promise<WidgetInformation> {
  if (!widget) {
    const script = await readFile(`${__dirname}/widget/adspFeedback.js`, 'utf8');
    const length = Buffer.byteLength(script, 'utf-8');
    const integrity = `sha256-${hasha(script, { algorithm: 'sha256', encoding: 'base64' })}`;
    widget = { script, length, integrity };
  }
  return widget;
}

export function downloadWidgetScript(getWidgetInformation: () => Promise<WidgetInformation>): RequestHandler {
  return async function (_req, res, next) {
    try {
      const { length, script } = await getWidgetInformation();
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'max-age=864000');
      res.setHeader('Content-Disposition', `inline`);
      res.setHeader('Content-Length', length);
      res.send(script);
    } catch (err) {
      next(err);
    }
  };
}

export function getWidgetScriptIntegrity(getWidgetInformation: () => Promise<WidgetInformation>): RequestHandler {
  return async function (req, res, next) {
    try {
      const { integrity } = await getWidgetInformation();
      res.json({ integrity });
    } catch (err) {
      next(err);
    }
  };
}

interface RouterProps {
  logger: Logger;
  tenantService: TenantService;
  queueService: WorkQueueService<FeedbackWorkItem>;
  valueService: ValueService;
  feedbackSiteService: FeedbackSiteService;
}

export async function createFeedbackRouter({
  logger,
  tenantService,
  queueService,
  valueService,
  feedbackSiteService,
}: RouterProps) {
  const rateLimitHandler = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  const router = Router();

  router.post(
    '/feedback',
    createValidationHandler(
      ...checkSchema(
        {
          tenant: {
            optional: { options: { nullable: true } },
            isString: true,
            isLength: { options: { min: 1, max: 100 } },
          },
          context: { isObject: true },
          'context.site': { isString: true, isLength: { options: { min: 1, max: 100 } } },
          'context.view': { isString: true, isLength: { options: { min: 1, max: 500 } } },
          'context.correlationId': {
            optional: { options: { nullable: true } },
            isString: true,
            isLength: { options: { min: 1, max: 500 } },
          },
          rating: {
            isString: true,
            isIn: { options: [['terrible', 'bad', 'neutral', 'good', 'delightful']] },
          },
          comment: {
            optional: { options: { nullable: true } },
            isString: true,
            isLength: { options: { min: 1, max: 2000 } },
          },
          technicalIssue: {
            optional: { options: { nullable: true } },
            isString: true,
            isLength: { options: { min: 1, max: 2000 } },
          },
        },
        ['body']
      )
    ),
    resolveFeedbackContext(tenantService, rateLimitHandler),
    sendFeedback(logger, queueService)
  );

  router.get('/script/adspFeedback.js', downloadWidgetScript(loadWidgetInformation));

  router.get('/script/integrity', getWidgetScriptIntegrity(loadWidgetInformation));

  router.get('/feedback', readValues(valueService));

  router.get('/sites', getSites(feedbackSiteService, tenantService));

  return router;
}
