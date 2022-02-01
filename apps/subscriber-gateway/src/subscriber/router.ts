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
    if (!RECAPTCHA_SECRET) {
      next();
    } else {
      try {
        const { token } = req.body;
        const { data } = await axios.post<SiteVerifyResponse>(
          `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`
        );

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
  directory: ServiceDirectory
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
    subscribeStatus(tenantService, tokenProvider, directory)
  );

  return router;
};
