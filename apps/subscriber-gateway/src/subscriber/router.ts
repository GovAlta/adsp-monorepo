import { adspId, Channel, ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import {
  InvalidOperationError,
  NotFoundError,
  UnauthorizedError,
  createValidationHandler,
  InvalidValueError,
} from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { body, param, query } from 'express-validator';

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

        if (
          !data.success ||
          !['subscribe_status', 'subscription_unsubscribe'].includes(data.action) ||
          data.score < SCORE_THRESHOLD
        ) {
          logger.warn(
            `Captcha verification failed for subscribe-status with result '${data.success}' on action '${data.action}' with score ${data.score}.`
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

export function subscribeStatus(
  tenantService: TenantService,
  tokenProvider: TokenProvider,
  directory: ServiceDirectory,
  logger: Logger
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { tenant: tenantName, email }: { tenant: string; email: string } = req.body;
      if (!email) {
        throw new InvalidOperationError('Email for subscription not provided.');
      }

      const tenant = await tenantService.getTenantByName(tenantName);
      if (!tenant) {
        throw new NotFoundError('Tenant', tenantName);
      }

      const notificationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:notification-service`);
      const token = await tokenProvider.getAccessToken();
      logger.info(`Add new subscribers to tenant with Id ${tenant.id}`);
      const subscribersUrl = new URL(`/subscription/v1/subscribers?tenantId=${tenant.id}`, notificationServiceUrl);
      const {
        data: { id },
      } = await axios.post<{ id: string }>(
        subscribersUrl.href,
        {
          userId: email.toLowerCase(),
          addressAs: '',
          channels: [
            {
              channel: Channel.email,
              address: email,
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      logger.info(`Change subscriptions with Id ${id}`);
      const subscriptionUrl = new URL(
        `/subscription/v1/types/status-application-status-change/subscriptions/${id}?tenantId=${tenant.id}`,
        notificationServiceUrl
      );
      const { data: subscription } = await axios.post(
        subscriptionUrl.href,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      res.send(subscription);
    } catch (err) {
      logger.error(`Create subscriber with error: ${err.message}`);
      next(err);
    }
  };
}

export function getSubscriber(tokenProvider: TokenProvider, directory: ServiceDirectory): RequestHandler {
  return async (req, res, next) => {
    try {
      const { subscriberId } = req.params;

      const notificationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:notification-service`);
      const token = await tokenProvider.getAccessToken();

      const subscribersUrl = new URL(
        `/subscription/v1/subscribers/${subscriberId}?includeSubscriptions=true`,
        notificationServiceUrl
      );

      try {
        const { data } = await axios.get(subscribersUrl.href, {
          headers: { Authorization: `Bearer ${token}` },
        });
        res.send(data);
      } catch (err) {
        if (err?.response?.status === 404) {
          throw new NotFoundError('Subscriber Id', subscriberId);
        }

        throw new InvalidOperationError(`Failed fetching subscriber.`);
      }
    } catch (err) {
      next(err);
    }
  };
}

export function getSubscriptionChannels(tokenProvider: TokenProvider, directory: ServiceDirectory): RequestHandler {
  return async (req, res, next) => {
    try {
      const { subscriber, type } = req.params;

      const notificationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:notification-service`);
      const token = await tokenProvider.getAccessToken();

      const subscribersUrl = new URL(
        `/subscription/v1/subscribers/${subscriber}/types/${type}/channels`,
        notificationServiceUrl
      );

      const { data } = await axios.get(subscribersUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.send(data);
    } catch (err) {
      next(err);
    }
  };
}

export function unsubscribe(tokenProvider: TokenProvider, directory: ServiceDirectory): RequestHandler {
  return async (req, res, next) => {
    try {
      const { type, id } = req.params;
      const tenantId = req.query.tenantId as string;

      const notificationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:notification-service`);
      const token = await tokenProvider.getAccessToken();
      const subscribersUrl = new URL(
        `/subscription/v1/types/${type}/subscriptions/${id}?tenantId=${tenantId}`,
        notificationServiceUrl
      );

      const result = await axios.delete(subscribersUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.send(result.data);
    } catch (err) {
      next(err);
    }
  };
}

interface RouterProps {
  logger: Logger;
  directory: ServiceDirectory;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
  RECAPTCHA_SECRET: string;
  SUBSCRIPTION_RECAPTCHA_SECRET: string;
}

export const createSubscriberRouter = ({
  logger,
  tenantService,
  tokenProvider,
  directory,
  RECAPTCHA_SECRET,
  SUBSCRIPTION_RECAPTCHA_SECRET,
}: RouterProps): Router => {
  const router = Router();

  router.post(
    '/application-status',
    verifyCaptcha(logger, RECAPTCHA_SECRET),
    createValidationHandler(body('tenant').isString(), body('email').isEmail()),
    subscribeStatus(tenantService, tokenProvider, directory, logger)
  );

  router.get(
    '/get-subscriber/:subscriberId',
    createValidationHandler(
      param('subscriberId')
        .customSanitizer((value) => value.replace(/[^a-zA-Z0-9- ]/g, ''))
        .isUUID(4)
    ),
    getSubscriber(tokenProvider, directory)
  );

  router.delete(
    '/types/:type/subscriptions/:id',
    verifyCaptcha(logger, SUBSCRIPTION_RECAPTCHA_SECRET),
    createValidationHandler(
      param('type')
        .customSanitizer((value) => value.replace(/[^a-zA-Z0-9- ]/g, ''))
        .matches(/^[a-zA-Z0-9-_ ]{1,50}$/), // get this regex from the configuration of the notification service
      param('id')
        .customSanitizer((value) => value.replace(/[^a-zA-Z0-9- ]/g, ''))
        .isMongoId(),
      // example of the tenant id here: urn:ads:platform:tenant-service:v2:/tenants/61e9adcc9423490012a9ae46
      query('tenantId')
        .customSanitizer((value) => value.replace(/[^a-zA-Z0-9-:/ ]/g, ''))
        .customSanitizer((tenantId) => {
          const tenantIOParts = tenantId.split('/');
          if (tenantIOParts.length < 3) {
            throw new InvalidValueError('tenantId', tenantId);
          }
          return tenantIOParts[0] + '/tenants/' + tenantIOParts[tenantIOParts.length - 1];
        })
        .isString()
    ),
    unsubscribe(tokenProvider, directory)
  );

  router.get(
    '/subscribers/:subscriber/types/:type/channels',
    createValidationHandler(
      param('type').customSanitizer((value) => value.replace(/[^a-zA-Z0-9- ]/g, '')),
      param('subscriber').customSanitizer((value) => value.replace(/[^a-zA-Z0-9- ]/g, ''))
    ),
    getSubscriptionChannels(tokenProvider, directory)
  );

  return router;
};
