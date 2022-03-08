import * as express from 'express';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment, POD_TYPES } from './environments/environment';
import { createRepositories } from './mongo';
import { bindEndpoints, ServiceUserRoles } from './app';
import * as cors from 'cors';
import { scheduleServiceStatusJobs } from './app/jobs';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import * as util from 'util';
import type { User } from '@abgov/adsp-service-sdk';
import {
  HealthCheckStartedDefinition,
  HealthCheckStoppedDefinition,
  HealthCheckUnhealthyDefinition,
  HealthCheckHealthyDefinition,
  ApplicationStatusChangedDefinition,
  ApplicationNoticePublishedDefinition,
} from './app/events';

import { StatusApplicationHealthChange, StatusApplicationStatusChange } from './app/notificationTypes';

const logger = createLogger('status-service', environment?.LOG_LEVEL || 'info');
const app = express();

app.use(cors());
app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

logger.debug(`Environment variables: ${util.inspect(environment)}`);

(async () => {
  const createRepoJob = createRepositories({ ...environment, logger });
  const [repositories] = [await createRepoJob];
  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { coreStrategy, tenantStrategy, tenantService, eventService } = await initializePlatform(
    {
      serviceId,
      displayName: 'Status service',
      description: 'Service for publishing service status information.',
      roles: [
        {
          role: ServiceUserRoles.StatusAdmin,
          description: 'Administrator role for the status service.',
          inTenantAdmin: true,
        },
      ],
      events: [
        HealthCheckStartedDefinition,
        HealthCheckStoppedDefinition,
        HealthCheckUnhealthyDefinition,
        HealthCheckHealthyDefinition,
        ApplicationStatusChangedDefinition,
        ApplicationNoticePublishedDefinition,
      ],
      notifications: [StatusApplicationHealthChange, StatusApplicationStatusChange],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger }
  );

  passport.use('jwt', coreStrategy);
  passport.use('jwt-tenant', tenantStrategy);
  passport.use(new AnonymousStrategy());

  const authenticate = passport.authenticate(['jwt-tenant', 'jwt', 'anonymous'], { session: false });

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());

  // start the endpoint checking jobs
  if (!environment.HA_MODEL || (environment.HA_MODEL && environment.POD_TYPE === POD_TYPES.job)) {
    scheduleServiceStatusJobs({
      logger,
      eventService,
      serviceStatusRepository: repositories.serviceStatusRepository,
      endpointStatusEntryRepository: repositories.endpointStatusEntryRepository,
    });
  }

  // service endpoints
  if (!environment.HA_MODEL || (environment.HA_MODEL && environment.POD_TYPE === POD_TYPES.api)) {
    bindEndpoints(app, { logger, tenantService, authenticate, eventService, ...repositories });
  } else {
    logger.info(`Job instance, skip the api binding.`);
  }
  // non-service endpoints
  app.get('/health', (_req, res) => {
    res.json({
      db: repositories.isConnected(),
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);
  // start service
  const port = environment.PORT || 3338;
  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
})();
