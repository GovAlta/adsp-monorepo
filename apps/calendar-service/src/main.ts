import * as express from 'express';
import * as fs from 'fs';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as cors from 'cors';
import * as helmet from 'helmet';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
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

  const repositories = await createRepositories({
    logger,
    ...environment,
  });

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);
  const { coreStrategy, tenantStrategy, configurationHandler, eventService, directory, healthCheck } =
    await initializePlatform(
      {
        serviceId,
        displayName: 'Calendar Service',
        description: 'Service that provides calendar date information, events, and scheduling.',
        roles: [
          {
            role: CalendarServiceRoles.Admin,
            description: 'Administrator account for calendars.',
          },
        ],
        events: [CalendarEventCreatedDefinition, CalendarEventUpdatedDefinition, CalendarEventDeletedDefinition],
        clientSecret: environment.CLIENT_SECRET,
        configurationSchema,
        configurationConverter: (config: CalendarServiceConfiguration, tenandId) =>
          Object.entries(config).reduce(
            (entities, [key, value]) => ({
              ...entities,
              [key]: new CalendarEntity(repositories.calendarRepository, tenandId, value),
            }),
            {}
          ),
        accessServiceUrl,
        directoryUrl: new URL(environment.DIRECTORY_URL),
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
  app.use(
    '/calendar',
    passport.authenticate(['core', 'tenant', 'anonymous'], { session: false }),
    configurationHandler
  );

  applyCalendarMiddleware(app, { serviceId, logger, eventService, directory, ...repositories });

  let swagger = null;
  app.use('/swagger/docs/v1', (_req, res) => {
    if (swagger) {
      res.json(swagger);
    } else {
      fs.readFile(`${__dirname}/swagger.json`, 'utf8', (err, data) => {
        if (err) {
          res.sendStatus(404);
        } else {
          swagger = JSON.parse(data);
          res.json(swagger);
        }
      });
    }
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
      _links: {
        self: new URL(req.originalUrl, rootUrl).href,
        health: new URL('/health', rootUrl).href,
        api: new URL('/calendar/v1', rootUrl).href,
        doc: new URL('/swagger/docs/v1', rootUrl).href,
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
