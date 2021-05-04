import { Router } from 'express';
import { IsDefined, MinLength } from 'class-validator';
import validationMiddleware from '../../middleware/requestValidator';
import * as TenantModel from '../models/tenant';
import * as HttpStatusCodes from 'http-status-codes';
import { adminOnlyMiddleware, tenantInitOnlyMiddleware } from '../../middleware/authentication';
import * as TenantService from '../services/tenant';
import { logger } from '../../middleware/logger';

class CreateTenantDto {
  @IsDefined()
  name: string;
}
class DeleteTenantDto {
  @IsDefined()
  name: string;
}
class TenantByNameDto {
  @IsDefined()
  @MinLength(4)
  name: string;
}

class TenantByEmailDto {
  @IsDefined()
  email;
}

class TenantByRealmDto {
  @IsDefined()
  realm;
}

class TenantDto {
  @IsDefined()
  @MinLength(4)
  name: string;
  @IsDefined()
  realm: string;
}

class ValidateIssuerDto {
  @IsDefined()
  issuer: string;
}

export const tenantPublicRouter = Router();
export const tenantRouter = Router();

async function getTenantByName(req, res) {
  const data = req.payload;
  const result = await TenantModel.findTenantByName(data.name);
  if (result.success) {
    return res.json(result.tenant);
  } else {
    return res.status(HttpStatusCodes.NOT_FOUND).json(result);
  }
}

async function getTenantByEmail(req, res) {
  const data = req.payload;
  const result = await TenantModel.findTenantByEmail(data.email);
  return res.json(result);
}

async function getTenantByRealm(req, res) {
  const data = req.payload;
  const result = await TenantModel.findTenantByRealm(data.realm);

  if (result.success) {
    return res.json(result.tenant);
  } else {
    return res.status(HttpStatusCodes.NOT_FOUND).json(result);
  }
}

async function createTenantInDB(req, res) {
  const tenant = req.payload;
  const result = await TenantModel.create(tenant);
  return res.json(result);
}

async function validateTokenIssuer(req, res) {
  const issuer = req.payload.issuer;
  const result = await TenantModel.validateTenantIssuer(issuer);

  if (result.success) {
    return res.status(HttpStatusCodes.OK);
  } else {
    return res.status(HttpStatusCodes.NOT_FOUND);
  }
}

async function fetchIssuers(req, res) {
  const result = await TenantModel.fetchIssuers();
  if (result.success) {
    return res.json(result.issuers);
  } else {
    return res.status(HttpStatusCodes.BAD_REQUEST);
  }
}

async function fetchRealmTenantMapping(req, res) {
  const result = await TenantModel.fetchRealmToNameMapping();
  if (result.success) {
    return res.json(result.realmToNameMapping);
  } else {
    return res.status(HttpStatusCodes.BAD_REQUEST);
  }
}

async function createTenant(req, res) {
  {
    const data = { status: 'ok', message: 'Create Realm Success!' };

    const payload = req.payload;

    const tenantName = payload.name;

    const email = req.user.email;

    const username = req.user.name;

    let tokenIssuer = req.user.tokenIssuer;

    tokenIssuer = tokenIssuer.replace('core', tenantName);

    try {
      logger.info('Starting create realm....');

      await TenantService.validateEmailInDB(email);
      await TenantService.createRealm(tenantName, email);
      await TenantService.createNewTenantInDB(username, email, tenantName, tenantName, tokenIssuer);

      return res.status(HttpStatusCodes.OK).json(data);
    } catch (err) {
      if (err instanceof TenantService.TenantError) {
        return res.status(err.errorCode).json({ error: err.message });
      }

      return res.status(err.response.status).json({ error: err.message });
    }
  }
}

async function deleteTenant(req, res) {
  const payload = req.payload;
  const tenantName = payload.name;

  try {
    const results = await TenantService.deleteTenant(tenantName);
    return res.status(HttpStatusCodes.OK).json({
      success: results.IdPBrokerClient.isDeleted && results.keycloakRealm.isDeleted && results.db.isDeleted,
      ...results,
    });
  } catch (err) {
    if (err instanceof TenantService.TenantError) {
      return res.status(err.errorCode).json({ error: err.message });
    } else {
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
    }
  }
}

tenantRouter.get('/name/:name', validationMiddleware(TenantByNameDto), getTenantByName);

tenantRouter.get('/realm/:realm', validationMiddleware(TenantByRealmDto), getTenantByRealm);

// email PII data, so use post method here
tenantRouter.post('/email', [tenantInitOnlyMiddleware, validationMiddleware(TenantByEmailDto)], getTenantByEmail);

tenantRouter.get('/issuer/:issuer', validationMiddleware(ValidateIssuerDto), validateTokenIssuer);

tenantRouter.post('/db', [adminOnlyMiddleware, validationMiddleware(TenantDto)], createTenantInDB);

tenantRouter.get('/issuers', adminOnlyMiddleware, fetchIssuers);

// Tenant admin only APIs
tenantRouter.get('/realms/names', adminOnlyMiddleware, fetchRealmTenantMapping);
tenantRouter.post('/', [tenantInitOnlyMiddleware, validationMiddleware(CreateTenantDto)], createTenant);
tenantRouter.delete('/', [adminOnlyMiddleware, validationMiddleware(DeleteTenantDto)], deleteTenant);
