import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment, POD_TYPES } from './environments/environment';
import { createRepositories } from './mongo';
import { bindEndpoints, ServiceUserRoles } from './app';
import * as cors from 'cors';
import { AdspId, initializePlatform, instrumentAxios } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { configurationSchema } from './mongo/schema';
import {
  HealthCheckStartedDefinition,
  HealthCheckStoppedDefinition,
  HealthCheckUnhealthyDefinition,
  HealthCheckHealthyDefinition,
  ApplicationStatusChangedDefinition,
  ApplicationNoticePublishedDefinition,
  MonitoredServiceUpDefinition,
  MonitoredServiceDownDefinition,
} from './app/events';

import { StatusApplicationHealthChange, StatusApplicationStatusChange } from './app/notificationTypes';
import { scheduleJob } from 'node-schedule';
import { AMQPCredentials, createAmqpConfigUpdateService } from '@core-services/core-common';
import { HealthCheckController } from './app/amqp';
import { HealthCheckJobScheduler } from './app/jobs';
import { getScheduler } from './app/jobs/SchedulerFactory';
import { ApplicationManager } from './app/model/applicationManager';

const logger = createLogger('status-service', environment?.LOG_LEVEL || 'info');
const app = express();

app.use(cors());
app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

instrumentAxios(logger);

(async () => {
  const createRepoJob = createRepositories({ ...environment, logger });
  const [repositories] = [await createRepoJob];
  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    configurationHandler,
    configurationService,
    coreStrategy,
    tenantStrategy,
    tenantService,
    eventService,
    clearCached,
    tokenProvider,
    directory,
    healthCheck,
    traceHandler,
  } = await initializePlatform(
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
      configuration: {
        description:
          'Service support contact information, and Applications including name, description, and URL. Application status, health check, and notices are not included.',
        schema: configurationSchema,
      },
      combineConfiguration: (tenant: Record<string, unknown>, _core: Record<string, unknown>) => ({
        // leave the core out        ...core,
        ...tenant,
      }),
      useLongConfigurationCacheTTL: true,
      events: [
        HealthCheckStartedDefinition,
        HealthCheckStoppedDefinition,
        HealthCheckUnhealthyDefinition,
        HealthCheckHealthyDefinition,
        ApplicationStatusChangedDefinition,
        ApplicationNoticePublishedDefinition,
        MonitoredServiceUpDefinition,
        MonitoredServiceDownDefinition,
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
  app.use(traceHandler);

  app.use('/status', configurationHandler);
  app.use('/public_status', configurationHandler);
  app.use('/notice', configurationHandler);

  const applicationManager = new ApplicationManager(
    tokenProvider,
    configurationService,
    serviceId,
    repositories.serviceStatusRepository,
    repositories.endpointStatusEntryRepository,
    directory,
    tenantService,
    logger
  );

  const healthCheckSchedulingProps = {
    logger,
    configurationService,
    eventService,
    serviceStatusRepository: repositories.serviceStatusRepository,
    endpointStatusEntryRepository: repositories.endpointStatusEntryRepository,
    applicationManager,
    directory,
    tokenProvider,
    serviceId,
  };

  const scheduler = new HealthCheckJobScheduler(healthCheckSchedulingProps);

  // start the endpoint checking jobs
  if (!environment.HA_MODEL || (environment.HA_MODEL && environment.POD_TYPE === POD_TYPES.job)) {
    logger.info(`Running Jobs`);
    // clear the health status database every midnight
    const scheduleDataReset = async () => {
      scheduleJob('0 0 * * *', async () => {
        await repositories.endpointStatusEntryRepository.deleteOldUrlStatus();
      });

      const healthCheckController = new HealthCheckController(
        {
          applicationManager: applicationManager,
          healthCheckScheduler: scheduler,
          logger: logger,
        },
        getScheduler(healthCheckSchedulingProps)
      );

      const amqpCredentials: AMQPCredentials = {
        AMQP_HOST: environment.AMQP_HOST,
        AMQP_USER: environment.AMQP_USER,
        AMQP_PASSWORD: environment.AMQP_PASSWORD,
        AMQP_URL: environment.AMQP_URL,
      };
      const queueService = await healthCheckController.connect(amqpCredentials);
      healthCheckController.subscribe(queueService);
    };

    // reload the cache every 5 minutes
    const scheduleCacheReload = async () => {
      scheduleJob('*/5 * * * *', async () => {
        scheduler.reloadCache(applicationManager);
      });
    };

    scheduler.loadHealthChecks(getScheduler(healthCheckSchedulingProps), scheduleDataReset, scheduleCacheReload);
  }

  const configurationSync = await createAmqpConfigUpdateService({
    ...environment,
    logger,
  });

  configurationSync.getItems().subscribe(({ item, done }) => {
    clearCached(item.tenantId, item.serviceId);
    done();
  });

  // service endpoints
  if (!environment.HA_MODEL || (environment.HA_MODEL && environment.POD_TYPE === POD_TYPES.api)) {
    bindEndpoints(app, {
      logger,
      tenantService,
      authenticate,
      eventService,
      tokenProvider,
      directory,
      configurationService,
      serviceId,
      ...repositories,
    });
  } else {
    logger.info(`Job instance, skip the api binding.`);
  }
  // non-service endpoints
  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
      db: repositories.isConnected(),
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Status service',
      description: 'Service for publishing service status information.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: [
          { href: new URL('/status/v1', rootUrl).href },
          { href: new URL('/public_status/v1', rootUrl).href },
          { href: new URL('/notice/v1', rootUrl).href },
        ],
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
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
