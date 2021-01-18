import * as fs from 'fs';
import * as express from 'express';
import * as healthCheck from 'express-healthcheck';
import { environment } from './environments/environment';

const app = express();

/* create realm */
let kcAdminClient = null;
const KcAdminClient = require('keycloak-admin').default;
const options = {
  baseUrl: environment.KEYCLOAK_ROOT_URL,
  realmName: environment.KEYCLOAK_REALM,
};
app.post('/createRealm', async (req, res) => {
  if (kcAdminClient == null) {
    kcAdminClient = new KcAdminClient(options);
    console.log('Init KcAdminClient');
    await kcAdminClient.auth({
      username: environment.REALM_ADMIN_USERNAME,
      password: environment.REALM_ADMIN_PASSWORD,
      grantType: 'password',
      clientId: environment.KEYCLOAK_CLIENT_ID,
    });
  }
  let data = { status: 'ok', message: 'Create Realm Success!' };
  const realmName = req.query.realm;

  if (!realmName) {
    data = { status: 'error', message: 'Please Input Realm name' };
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

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to tenant-management-api!' });
});

app.use('/health', healthCheck());

let swagger = null;
app.use('/swagger/docs/v1', (req, res) => {
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

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
