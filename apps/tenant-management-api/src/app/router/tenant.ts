import { Router } from 'express';
import { IsDefined, MinLength } from 'class-validator';
import validationMiddleware from '../../middleware/requestValidator';
import * as TenantModel from '../models/tenant';
import * as HttpStatusCodes from 'http-status-codes';
import { adminOnlyMiddleware } from '../../middleware/authentication';
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

async function createTenant(req, res) {
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
tenantRouter.get('/name/:name', validationMiddleware(TenantByNameDto), getTenantByName);

tenantRouter.get('/realm/:realm', validationMiddleware(TenantByRealmDto), getTenantByRealm);

// email PII data, so use post method here
tenantRouter.post('/email', validationMiddleware(TenantByEmailDto), getTenantByEmail);

tenantRouter.get('/issuer/:issuer', validationMiddleware(ValidateIssuerDto), validateTokenIssuer);

tenantRouter.get('/realms/names', adminOnlyMiddleware, fetchRealmTenantMapping);

tenantRouter.post('/', validationMiddleware(TenantDto), createTenant);

tenantRouter.get('/issuers', fetchIssuers);
