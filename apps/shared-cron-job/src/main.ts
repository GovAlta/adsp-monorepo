import express from 'express';
import cron from 'node-cron';
import { AdspId, initializePlatform, PlatformCapabilities, adspId } from '@abgov/adsp-service-sdk';
import { environment } from './environments/environment';
import { createLogger } from '@core-services/core-common';
import axios from 'axios';
import { debug } from 'node:console';

const serviceId = AdspId.parse(environment.CLIENT_ID);

const ServiceUserRoles = {
  CronJobAdmin: 'cron-job-admin',
};
const logger = createLogger('shared-cron-job-service', environment?.LOG_LEVEL || 'info');
const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
let platformHelper: PlatformCapabilities = null;
(async () => {
  platformHelper = await initializePlatform(
    {
      serviceId,
      displayName: 'Shared cron job service',
      description: 'Service for running shared cron job',
      roles: [
        {
          role: ServiceUserRoles.CronJobAdmin,
          description: 'Administrator role for the status service.',
          inTenantAdmin: true,
        },
      ],
      combineConfiguration: (tenant: Record<string, unknown>, _core: Record<string, unknown>) => ({
        // leave the core out        ...core,
        ...tenant,
      }),
      events: [],
      notifications: [],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger },
  );
})();

async function runFeedbackWeeklySummary(platformHelper: PlatformCapabilities) {
  const { directory, tokenProvider } = platformHelper;
  const feedbackServiceId: AdspId = adspId`urn:ads:platform:feedback-service`;

  logger.debug(`feedback service id ${feedbackServiceId}`);
  const accessToken = await tokenProvider.getAccessToken();

  logger.debug(`access token: ${accessToken}`);

  const tenants = await platformHelper.tenantService.getTenants();

  const feedbackHost = await directory.getServiceUrl(feedbackServiceId);

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const params = {
    start: new Date().toISOString(),
    end: lastWeek.toISOString(),
  };

  const lastWeekFeedback = await axios.get(`${feedbackHost}feedback/v1/feedback`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params,
  });

  for (const tenant of tenants) {
    logger.debug(`Processing tenant: ${tenant.name} (${tenant.id})`);
    const sites = await platformHelper.configurationService.getConfiguration(
      feedbackServiceId,
      accessToken,
      adspId`${tenant.id}`,
    );

    logger.debug(`sites: ${JSON.stringify(sites)}`);

    logger.debug(`Last feedback for : ${lastWeekFeedback}`);
  }
}

// put the weekly summary into on minute cron for testing purpose
cron.schedule('* * * * *', async () => {
  logger.info('Start to run ');
  await runFeedbackWeeklySummary(platformHelper);
});

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = express();

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
