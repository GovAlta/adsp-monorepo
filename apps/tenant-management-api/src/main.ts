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
import { environment } from './environments/environment';

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

app.use('/api/', [
  passport.authenticate(['jwt'], { session: false }),
  apiRouter,
]);

app.use('/health', healthCheck());

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

process.on('SIGINT', async () => {
  await disconnect();
  logger.info('Tenant management api exit, Byte');
  process.exit();
});

server.on('error', console.error);
