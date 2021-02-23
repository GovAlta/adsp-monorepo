import * as fs from 'fs';
import * as express from 'express';
import * as healthCheck from 'express-healthcheck';
import { createConfigService } from './configuration-management';
import { connectMongo, disconnect } from './mongo/index';
import * as swaggerUi from 'swagger-ui-express';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as passport from 'passport';
import {
  createKeycloakStrategy,
  KeycloakStrategyProps,
} from '@core-services/core-common';
import apiRouter from './app/router';
import { logger } from './middleware/logger';
import { Request, Response, NextFunction } from 'express'
import { environment } from './environments/environment';
import {
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError
} from '@core-services/core-common';

import * as cors from 'cors';

const version = require('../../../package.json').version;

const app = express();
app.use(express.json());
/* Connect to mongo db */
connectMongo();

app.use(cors());

const keycloakProps: KeycloakStrategyProps = {
  KEYCLOAK_ROOT_URL:
    process.env.KEYCLOAK_ROOT_URL ||
    environment.KEYCLOAK_ROOT_URL ||
    'http://localhost:8080',
  KEYCLOAK_REALM:
    process.env.KEYCLOAK_REALM || environment.KEYCLOAK_REALM || 'master',
};

passport.use('jwt', createKeycloakStrategy(keycloakProps));
passport.use(new AnonymousStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const swaggerDocument = fs.readFileSync(__dirname + '/swagger.json', 'utf8');

app.use(passport.initialize());

app.get('/welcome', (req, res) => {
  res.send({ message: 'Welcome to tenant-management-api!' });
});
app.get('/version', (req, res) => {
  res.send(`Version: ${version}`);
});
app.use('/health', healthCheck());

// Q: log info should include user info?
app.use('/', (req:Request,resp:Response,next:NextFunction)=>{
  resp.on('finish', () => {
    if (resp.statusCode === 401) {
      logger.error('401 Unauthorized, Please set valid token in request',
        `${JSON.stringify(req.query)}`);
    }
  });
  logger.info(`${req.method}  ${req.path} Status Code : ${resp.statusCode}`);
  next();
}
);
app.use('/api', [
  passport.authenticate(['jwt'], { session: false }),
  apiRouter,
]);

app.use((err:Error, req:Request, res:Response, next:NextFunction) => {
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

app.use(
  '/swagger/docs',
  swaggerUi.serve,
  swaggerUi.setup(JSON.parse(swaggerDocument))
);

app.get('/swagger/json/v1', (req, res) => {
  res.json(JSON.parse(swaggerDocument));
});

const port = process.env.port || 3333;

createConfigService(app);

const server = app.listen(port, () => {
  logger.info(`Listening at http://localhost:${port}/api`);
});

const handleExit = async(message,code,err)=>{
  await disconnect();
  server.close();
  (err === null)? logger.info(message):logger.error(message,err);
  process.exit(code);

}

process.on('SIGINT', async () => {
  handleExit('Tenant management api exit, Byte',1,null);
});
process.on('SIGTERM', async () => {
  handleExit('Tenant management api was termination, Byte',1,null);
});
process.on('uncaughtException', async(err: Error) => {
  handleExit('Tenant management api Uncaught exception',1,err);
});



