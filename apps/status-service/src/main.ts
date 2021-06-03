import * as express from 'express';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { createLogger, UnauthorizedError, NotFoundError, InvalidOperationError } from '@core-services/core-common';
import { environment } from './environments/environment';
import { createRepositories } from './mongo';
import { bindEndpoints } from './app';
import * as cors from 'cors';
import { scheduleServiceStatusJobs } from './app/jobs';
import { AdspId, createCoreStrategy, initializePlatform } from '@abgov/adsp-service-sdk';
import * as util from 'util';
import { GoAError } from './app/common/errors';

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
  const { tenantStrategy } = await initializePlatform(
    {
      serviceId,
      displayName: 'Status Service',
      description: 'Service for publishing service status information.',
      clientSecret: environment.CLIENT_SECRET,
      accessServiceUrl,
      directoryUrl: new URL(environment.DIRECTORY_URL),
      ignoreServiceAud: true,
    },
    { logger }
  );

  passport.use(
    'jwt',
    createCoreStrategy({
      logger,
      serviceId,
      accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
      ignoreServiceAud: true,
    })
  );
  passport.use('jwt-tenant', tenantStrategy);

  passport.use(new AnonymousStrategy());

  const authenticate = passport.authenticate(['jwt-tenant', 'jwt'], { session: false });
  const authenticateCore = passport.authenticate(['jwt'], { session: false });

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });

  app.use(passport.initialize());
  scheduleServiceStatusJobs({ logger, serviceStatusRepository: repositories.serviceStatusRepository });
  // service endpoints
  bindEndpoints(app, { logger, authenticate, ...repositories });

  // non-service endpoints
  app.get('/health', (_req, res) => {
    res.json({
      db: repositories.isConnected(),
    });
  });

  // error handler
  app.use((err, _req, res, _next) => {
    if (err instanceof GoAError) {
      res.status(err.statusCode).send(err.message);
    } else {
      res.sendStatus(500);
    }
  });

  // start service
  const port = environment.PORT || 3338;
  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
})();
