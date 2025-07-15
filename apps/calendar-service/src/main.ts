import * as express from 'express';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform, ServiceMetricsValueDefinition } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createRepositories } from './postgres';
import {
  applyCalendarMiddleware,
  CalendarServiceConfiguration,
  CalendarServiceRoles,
  configurationSchema,
  CalendarEntity,
  CalendarEventCreatedDefinition,
  CalendarEventDeletedDefinition,
  CalendarEventUpdatedDefinition,
} from './calendar';

const logger = createLogger('calendar-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors());

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const repositories = await createRepositories({
    logger,
    ...environment,
  });

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const {
    coreStrategy,
    tenantStrategy,
    tenantService,
    tenantHandler,
    configurationHandler,
    metricsHandler,
    eventService,
    directory,
    healthCheck,
    traceHandler,
  } = await initializePlatform(
    {
      serviceId,
      displayName: 'Calendar service',
      description: 'Service that provides calendar date information, events, and scheduling.',
      roles: [
        {
          role: CalendarServiceRoles.Admin,
          description: 'Administrator account for calendars.',
          inTenantAdmin: true,
        },
      ],
      events: [CalendarEventCreatedDefinition, CalendarEventUpdatedDefinition, CalendarEventDeletedDefinition],
      clientSecret: environment.CLIENT_SECRET,
      configuration: {
        description: 'Calendars including configuration of the roles allowed to read or modify events in the calendar',
        schema: configurationSchema,
      },
      combineConfiguration: (
        tenant: CalendarServiceConfiguration,
        core: CalendarServiceConfiguration,
        tenantId?: AdspId
      ) =>
        Object.entries({ ...tenant, ...core }).reduce(
          (entities, [key, value]) => ({
            ...entities,
            [key]: new CalendarEntity(repositories.calendarRepository, tenantId, value),
          }),
          {}
        ),
      enableConfigurationInvalidation: true,
      useLongConfigurationCacheTTL: true,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      values: [ServiceMetricsValueDefinition],
    },
    { logger }
  );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);
  passport.use('anonymous', new AnonymousStrategy());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.use(
    '/calendar',
    metricsHandler,
    passport.authenticate(['core', 'tenant', 'anonymous'], { session: false }),
    tenantHandler,
    configurationHandler
  );

  applyCalendarMiddleware(app, { serviceId, logger, eventService, directory, tenantService, ...repositories });

  const swagger = JSON.parse(await promisify(readFile)(`${__dirname}/swagger.json`, 'utf8'));
  app.use('/swagger/docs/v1', (_req, res) => {
    res.json(swagger);
  });

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      ...platform,
      db: await repositories.isConnected(),
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Calendar service',
      description: 'Service that provides calendar date information, events, and scheduling.',
      _links: {
        self: {
          href: new URL(req.originalUrl, rootUrl).href,
        },
        health: {
          href: new URL('/health', rootUrl).href,
        },
        api: {
          href: new URL('/calendar/v1', rootUrl).href,
        },
        docs: {
          href: new URL('/swagger/docs/v1', rootUrl).href,
        },
      },
    });
  });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp().then((app) => {
  const port = environment.PORT || 3342;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
