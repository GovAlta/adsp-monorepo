import { Router } from 'express';
import KcAdminClient from 'keycloak-admin';
import { IsDefined, IsOptional } from 'class-validator';

import { logger } from '../../middleware/logger';
import { check } from 'express-validator/check';
import { environment } from '../../environments/environment';
import * as HttpStatusCodes from 'http-status-codes';
import * as TenantModel from '../services/tenant/model';
import validationMiddleware from '../../middleware/requestValidator';

const realmRouter = Router();

let kcAdminClient = null;

const options = {
  baseUrl:
    (environment.KEYCLOAK_ROOT_URL || process.env.KEYCLOAK_ROOT_URL) + '/auth',
  realmName: 'master',
};

const authOptions = {
  username:
    environment.REALM_ADMIN_USERNAME || process.env.REALM_ADMIN_USERNAME,
  password:
    environment.REALM_ADMIN_PASSWORD || process.env.REALM_ADMIN_PASSWORD,
  grantType: 'password',
  clientId:
    environment.KEYCLOAK_ADMIN_CLIENT_ID ||
    process.env.KEYCLOAK_ADMIN_CLIENT_ID,
};

class CreateRealmDto {
  @IsOptional()
  readonly tenantName = null;
  @IsDefined()
  realm: string;
}

async function createRealm(req, res) {
  {
    if (kcAdminClient == null) {
      kcAdminClient = new KcAdminClient(options);
      logger.info('Init KcAdminClient...');

      try {
        await kcAdminClient.auth(authOptions);
      } catch (e) {
        logger.error(e);
        res
          .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: 'Create Realm failed!' });
      }
    }

    const data = { status: 'ok', message: 'Create Realm Success!' };
    const payload = req.payload;
    const realmName = payload.realm;
    let tenantName = realmName;

    if (!payload.tenantName) {
      tenantName = realmName;
    }

    try {
      const tenant = {
        name: tenantName,
        realm: realmName,
      };

      const createTenantResult = await TenantModel.create(tenant);

      if (!createTenantResult.success) {
        throw createTenantResult.errors;
      }

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

      logger.info('Starting create tenant');

      return res.status(HttpStatusCodes.OK).json(data);
    } catch (err) {
      logger.error(err);
      // The err might include token
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Create Realm failed!' });
    }
  }
}

realmRouter.post('/', validationMiddleware(CreateRealmDto), createRealm);

export default realmRouter;
