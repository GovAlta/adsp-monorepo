import * as express from 'express';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as passport from 'passport';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { createLogger, createErrorHandler } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createSharePointRouter, SharePointServiceRoles } from './sharepoint';

const logger = createLogger('sharepoint-service', environment.LOG_LEVEL);

const initializeApp = async (): Promise<express.Application> => {
  const app = express();

  app.use(cors());
  app.use(compression());
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  const serviceId = AdspId.parse(environment.CLIENT_ID);
  const accessServiceUrl = new URL(environment.KEYCLOAK_ROOT_URL);

  const { coreStrategy, tenantStrategy, tenantHandler, healthCheck, traceHandler } = await initializePlatform(
    {
      serviceId,
      displayName: 'SharePoint service',
      description: 'Service that pushes tenant data and files to configured SharePoint destinations.',
      roles: [
        {
          role: SharePointServiceRoles.Admin,
          description: 'Administrator role for managing SharePoint connections.',
          inTenantAdmin: true,
        },
        {
          role: SharePointServiceRoles.Writer,
          description: 'Role permitting push of data and files to SharePoint destinations.',
        },
      ],
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
    },
    { logger },
  );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(traceHandler);

  app.get('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json(platform);
  });

  app.use(
    '/sharepoint/v1/sharepoint',
    passport.authenticate(['core', 'tenant'], { session: false }),
    tenantHandler,
    createSharePointRouter({ logger }),
  );

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  return app;
};

initializeApp()
  .then((app) => {
    const port = environment.PORT;

    const server = app.listen(port, () => {
      logger.info(`SharePoint service listening at http://localhost:${port}`);
    });
    server.on('error', (err) => {
      logger.error(`Error starting server: ${err}`);
    });
  })
  .catch((err) => {
    logger.error(`Failed to start service: ${err}`);
    process.exit(1);
  });
