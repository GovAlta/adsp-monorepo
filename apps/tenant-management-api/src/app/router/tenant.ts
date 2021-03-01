import { Router } from 'express';
import { IsDefined, MinLength } from 'class-validator';
import validationMiddleware from '../../middleware/requestValidator';
import * as TenantModel from '../models/tenant';
import * as HttpStatusCodes from 'http-status-codes';

class TenantByNameDto {
  @IsDefined()
  @MinLength(4)
  name: string;
}

class TenantByEmailDto {
  @IsDefined()
  email;
}

class TenantDto {
  @IsDefined()
  @MinLength(4)
  name: string;
  @IsDefined()
  realm: string;
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

tenantRouter.get(
  '/name/:name',
  validationMiddleware(TenantByNameDto),
  getTenantByName
);

// email PII data, so use post method here
tenantRouter.post(
  '/email',
  validationMiddleware(TenantByEmailDto),
  getTenantByEmail
);

tenantRouter.post('/', validationMiddleware(TenantDto), createTenant);
