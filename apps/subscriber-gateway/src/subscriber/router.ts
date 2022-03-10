import { adspId, Channel, ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';

interface SiteVerifyResponse {
  success: boolean;
  score: number;
  action: string;
}

export function verifyCaptcha(logger: Logger, RECAPTCHA_SECRET: string, SCORE_THRESHOLD = 0.5): RequestHandler {
  return async (req, _res, next) => {
    //console.log(JSON.stringify(RECAPTCHA_SECRET) + '<RECAPTCHA_SECRET');
    if (!RECAPTCHA_SECRET) {
      next();
    } else {
      try {
        const { token } = req.body;
        //console.log(JSON.stringify(token) + '<token');
        const { data } = await axios.post<SiteVerifyResponse>(
          `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`
        );

        //console.log(JSON.stringify(data) + '<data');

        if (!data.success || data.action !== 'subscribe_status' || data.score < SCORE_THRESHOLD) {
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

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export function getSubscriber(
  tenantService: TenantService,
  tokenProvider: TokenProvider,
  directory: ServiceDirectory
): RequestHandler {
  return async (req, res, next) => {
    try {
      console.log('wtfbbq');
      const { subscriberId } = req.params;

      //console.log(JSON.stringify(subscriberId) + '<subscriberId');

      const notificationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:notification-service`);
      //console.log(JSON.stringify(notificationServiceUrl) + '<notificationServiceUrl');
      const token = await tokenProvider.getAccessToken();
      //console.log(JSON.stringify(token) + '<token');

      const subscribersUrl = new URL(
        `/subscription/v1/subscribers/subscriberDetails/${subscriberId}?includeSubscriptions=true`,
        notificationServiceUrl
      );
      //console.log(JSON.stringify(subscribersUrl) + '<subscribersUrl');
      const { data } = await axios.get(subscribersUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(JSON.stringify(data, getCircularReplacer()) + '<subscriber');
      console.log('wtfbbq2');
      res.send(data);
    } catch (err) {
      //console.log(JSON.stringify(err.message, getCircularReplacer()) + '<err.message');
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
}

export const createSubscriberRouter = ({
  logger,
  tenantService,
  tokenProvider,
  directory,
  RECAPTCHA_SECRET,
}: RouterProps): Router => {
  const router = Router();

  router.post(
    '/application-status',
    verifyCaptcha(logger, RECAPTCHA_SECRET),
    subscribeStatus(tenantService, tokenProvider, directory, logger)
  );

  router.get('/get-subscriber/:subscriberId', getSubscriber(tenantService, tokenProvider, directory));

  return router;
};
