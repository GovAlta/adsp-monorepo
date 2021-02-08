import { Router } from 'express';
import KcAdminClient from 'keycloak-admin';
import { logger } from '../../middleware/logger';
import { check } from 'express-validator/check';
import { environment } from '../../environments/environment';
import * as HttpStatusCodes from 'http-status-codes';

const realmRouter = Router();

let kcAdminClient = null;

const options = {
  baseUrl: environment.KEYCLOAK_ROOT_URL || process.env.KEYCLOAK_ROOT_URL,
  realmName: environment.KEYCLOAK_REALM || process.env.KEYCLOAK_REALM,
};

const authOptions = {
  username:
    environment.REALM_ADMIN_USERNAME || process.env.REALM_ADMIN_USERNAME,
  password:
    environment.REALM_ADMIN_PASSWORD || process.env.REALM_ADMIN_PASSWORD,
  grantType: 'password',
  clientId: environment.KEYCLOAK_CLIENT_ID || process.env.KEYCLOAK_CLIENT_ID,
};

realmRouter.post('/', [check('realm').not().isEmpty()], async (req, res) => {
  if (kcAdminClient == null) {
    kcAdminClient = new KcAdminClient(options);
    logger.info('Init KcAdminClient...');
    await kcAdminClient.auth(authOptions);
  }
  const data = { status: 'ok', message: 'Create Realm Success!' };
  const realmName = req.body.realm;

  if (!realmName) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ errors: 'Please Input Realm name' });
  } else {
    try {
      logger.info('Starting create realm....');
      const realm = await kcAdminClient.realms.create({
        id: realmName,
        realm: realmName,
      });
      if (realm.realmName != realmName) {
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ error: 'Create Realm failed!' });
      }

      res.status(HttpStatusCodes.OK).json(data);
    } catch (err) {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(err);
    }
  }
});

export default realmRouter;
