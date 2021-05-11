import * as express from 'express';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import {
  createLogger,
  createKeycloakStrategy,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
  DomainEventService,
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { applyFileMiddleware } from './file';
import { createRepositories } from './mongo';
import { createEventService } from './amqp';
import * as cors from 'cors';
import * as fs from 'fs';

const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');

const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cors());

passport.use('jwt', createKeycloakStrategy());
passport.use(new AnonymousStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(passport.initialize());
app.use('/space', passport.authenticate(['jwt'], { session: false }));
app.use('/file-admin', passport.authenticate(['jwt'], { session: false }));
app.use('/file', passport.authenticate(['jwt', 'anonymous'], { session: false }));
app.use('/file-type', passport.authenticate(['jwt'], { session: false }));

Promise.all([
  createRepositories({ ...environment, logger }),
  environment.AMQP_HOST
    ? createEventService({ ...environment, logger })
    : Promise.resolve<DomainEventService>({
        send: (event) => logger.debug(`Event sink received event '${event.namespace}:${event.name}'`),
        isConnected: () => true,
      }),
]).then(([repositories, eventService]) => {
  applyFileMiddleware(app, {
    logger,
    rootStoragePath: environment.FILE_PATH,
    avProvider: environment.AV_PROVIDER,
    avHost: environment.AV_HOST,
    avPort: environment.AV_PORT,
    eventService,
    ...repositories,
  });

  app.get('/health', (req, res) =>
    res.json({
      db: repositories.isConnected(),
      msg: eventService.isConnected(),
    })
  );

  /*eslint-disable */
  app.use((err, req, res, next) => {
    /*eslint-enable */
    if (err instanceof UnauthorizedError) {
      res.status(401).send(err.message);
    } else if (err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else if (err instanceof InvalidOperationError) {
      res.status(400).send(err.message);
    } else {
      logger.warn(`Unexpected error encountered in handler: ${err}`);
      res.sendStatus(500);
    }
  });

  // Define swagger
  let swaggerDocument = fs.readFileSync(__dirname + '/swagger.json', 'utf8');
  app.get('/swagger/json/v1', (req, res) => {
    const { tenant } = req.query;
    const keycloakRootTag = '<KEYCLOAK_ROOT>';
    swaggerDocument = swaggerDocument.replace(keycloakRootTag, process.env.KEYCLOAK_ROOT_URL);
    const swaggerObj = JSON.parse(swaggerDocument);
    const tenantAuthentication = swaggerObj?.components?.securitySchemes?.tenant?.flows.authorizationCode;
    if (tenant && tenantAuthentication) {
      tenantAuthentication.tokenUrl = tenantAuthentication.tokenUrl.replace('realms/autotest', `realms/${tenant}`);
      tenantAuthentication.authorizationUrl = tenantAuthentication.authorizationUrl.replace(
        'realms/autotest',
        `realms/${tenant}`
      );
      swaggerObj.components.securitySchemes.tenant.flows.authorizationCode = tenantAuthentication;
    }

    res.json(swaggerObj);
  });

  const port = environment.PORT || 3337;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  const handleExit = async (message, code, err) => {
    server.close();
    err === null ? logger.info(message) : logger.error(message, err);
    process.exit(code);
  };

  process.on('SIGINT', async () => {
    handleExit('Tenant management api exit, Byte', 1, null);
  });
  process.on('SIGTERM', async () => {
    handleExit('Tenant management api was termination, Byte', 1, null);
  });
  process.on('uncaughtException', async (err: Error) => {
    handleExit('Tenant management api Uncaught exception', 1, err);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
