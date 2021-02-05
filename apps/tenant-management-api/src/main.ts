import * as fs from 'fs';
import * as express from 'express';
import * as healthCheck from 'express-healthcheck';
import { environment } from './environments/environment';
import { createConfigService} from './configuration-management';
import { connectMongo, disconnect } from './mongo/index';
import directoryRouter from './app/router/directory';
import fileRouter from './app/router/file';
import * as swaggerUi from 'swagger-ui-express';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as passport from 'passport';
import {
  createKeycloakStrategy,
  KeycloakStrategyProps,
} from '@core-services/core-common';
import KcAdminClient from 'keycloak-admin';
import { logger } from './middleware/logger';

import * as cors from 'cors';


const app = express();
app.use(express.json());
/* Connect to mongo db */
connectMongo();
app.use(cors())

/* create realm */
let kcAdminClient = null;

const options = {
  baseUrl: process.env.KEYCLOAK_ROOT_URL,
  realmName: process.env.KEYCLOAK_REALM,
};

app.post('/createRealm', async (req, res) => {
  if (kcAdminClient == null) {
    kcAdminClient = new KcAdminClient(options);
    console.log('Init KcAdminClient');
    await kcAdminClient.auth({
      username: process.env.REALM_ADMIN_USERNAME,
      password: process.env.REALM_ADMIN_PASSWORD,
      grantType: 'password',
      clientId: process.env.KEYCLOAK_CLIENT_ID,
    });
  }
  let data = { status: 'ok', message: 'Create Realm Success!' };
  const realmName = req.query.realm;

  if (!realmName) {
    data = { status: 'error', message: 'Please Input Realm name' };
    res.status(400);
  } else {
    const realm = await kcAdminClient.realms.create({
      id: realmName,
      realm: realmName,
    });
    if (realm.realmName != realmName) {
      data = { status: 'error', message: 'Create Realm failed!' };
    }
  }
  res.status(200).json(data);
});

const keycloakProps: KeycloakStrategyProps = {
  KEYCLOAK_ROOT_URL: process.env.KEYCLOAK_ROOT_URL || 'http://localhost:8080',
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'master',
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

app.use('/api/discovery', directoryRouter);

app.use('/api/v1/tenant/file',
  [
    passport.authenticate(['jwt'], { session: false }),
    fileRouter
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

createConfigService(app, environment);

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

process.on('SIGINT', async () => {
  await disconnect();
  logger.info('Tenant management api exit, Byte');
  process.exit();
});

server.on('error', console.error);
