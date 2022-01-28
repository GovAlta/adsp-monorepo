import { adspId, ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { NotFoundError, UnauthorizedError } from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';

interface SiteVerifyResponse {
  success: boolean;
  score: number;
  action: string;
}

export function verifyReCaptcha(RECAPTCHA_SECRET: string, SCORE_THRESHOLD = 0.5): RequestHandler {
  return async (req, res, next) => {
    try {
      const { token } = req.body;
      const { data } = await axios.post<SiteVerifyResponse>(
        `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`
      );

      if (!data.success || data.action !== 'subscribe-status' || data.score < SCORE_THRESHOLD) {
        throw new UnauthorizedError('Request rejected because captacha verification not successful.');
      }

      next();
    } catch (err) {
      next(err);
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
      const { tenant: tenantName, email } = req.body;
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
        { email: email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const subscriptionUrl = new URL(
        `${this.baseUrl}/subscription/v1/types/status-application-status-change/subscriptions/${id}?tenantId=${tenant.id}`,
        notificationServiceUrl
      );
      const { data: subscription } = await axios.post(subscriptionUrl.href, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      res.send(subscription);
    } catch (err) {
      next(err);
    }
  };
}

interface RouterProps {
  directory: ServiceDirectory;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
  RECAPTCHA_SECRET: string;
}

export const createSubscriberRouter = ({
  tenantService,
  tokenProvider,
  directory,
  RECAPTCHA_SECRET,
}: RouterProps): Router => {
  const router = Router();

  router.post(
    '/application-status',
    RECAPTCHA_SECRET ? verifyReCaptcha(RECAPTCHA_SECRET) : (_req, _res, next) => next(),
    subscribeStatus(tenantService, tokenProvider, directory)
  );

  return router;
};
