import { Router } from 'express';
import { IsDefined, IsOptional } from 'class-validator';
import { logger } from '../../middleware/logger';
import * as HttpStatusCodes from 'http-status-codes';
import validationMiddleware from '../../middleware/requestValidator';
import * as TenantService from '../services/tenant';

const realmRouter = Router();
class CreateRealmDto {
  @IsOptional()
  readonly tenantName = null;
  @IsDefined()
  realm: string;
}

async function createRealm(req, res) {
  {
    const data = { status: 'ok', message: 'Create Realm Success!' };
    const payload = req.payload;
    const realmName = payload.realm;
    let tenantName = realmName;
    const email = req.user.email;
    const username = req.user.name;
    let tokenIssuer = req.user.tokenIssuer;

    if (!payload.tenantName) {
      tenantName = realmName;
    }

    tokenIssuer = tokenIssuer.replace('core', realmName);

    try {
      logger.info('Starting create realm....');
      await TenantService.validateEmailInDB(email);
      await TenantService.createRealm(realmName);
      await TenantService.createNewTenantInDB(username, email, realmName, tenantName, tokenIssuer);
      return res.status(HttpStatusCodes.OK).json(data);
    } catch (err) {
      if (err instanceof TenantService.TenantError) {
        return res.status(err.errorCode).json({ error: err.message });
      }
      return res.status(err.response.status).json({ error: err.message });
    }
  }
}

async function deleteRealm(req, res) {
  const data = { status: 'ok', message: 'Delete Realm Success!' };
  const payload = req.payload;
  const realmName = payload.realm;

  try {
    TenantService.deleteTenantByRealm(realmName);
    return res.status(HttpStatusCodes.OK).json(data);
  } catch (err) {
    if (err instanceof TenantService.TenantError) {
      return res.status(err.errorCode).json({ error: err.message });
    } else {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

realmRouter.post('/', validationMiddleware(CreateRealmDto), createRealm);

realmRouter.delete('/', validationMiddleware(CreateRealmDto), deleteRealm);

export default realmRouter;
