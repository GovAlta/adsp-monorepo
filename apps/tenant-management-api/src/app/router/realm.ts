import { Router } from 'express';
import { IsDefined, IsOptional } from 'class-validator';
import { logger } from '../../middleware/logger';
import * as HttpStatusCodes from 'http-status-codes';
import * as TenantModel from '../services/tenant/model';
import validationMiddleware from '../../middleware/requestValidator';
import { createkcAdminClient } from '../../keycloak';

const realmRouter = Router();
class CreateRealmDto {
  @IsOptional()
  readonly tenantName = null;
  @IsDefined()
  realm: string;
}

async function createRealm(req, res) {
  {
    const kcAdminClient = await createkcAdminClient();

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
