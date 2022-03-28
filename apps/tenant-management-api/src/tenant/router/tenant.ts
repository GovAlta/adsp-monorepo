import { Request, Response, Router } from 'express';
import { IsDefined } from 'class-validator';
import validationMiddleware from '../../middleware/requestValidator';
import * as HttpStatusCodes from 'http-status-codes';
import {
  requireTenantServiceAdmin,
  requireTenantAdmin,
  requireBetaTesterOrAdmin,
} from '../../middleware/authentication';
import * as TenantService from '../services/tenant';
import { logger } from '../../middleware/logger';
import { v4 as uuidv4 } from 'uuid';
import { adspId, EventService } from '@abgov/adsp-service-sdk';
import { tenantCreated } from '../events';
import { TenantRepository } from '../repository';
import { ServiceClient } from '../types';
import { InvalidOperationError, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { TenantServiceRoles } from '../../roles';

class CreateTenantDto {
  @IsDefined()
  name: string;
}
class GetTenantDto {
  @IsDefined()
  id: string;
}
class DeleteTenantDto {
  @IsDefined()
  realm: string;
}
class TenantByEmailDto {
  @IsDefined()
  email;
}

class TenantByNameDto {
  @IsDefined()
  name;
}

class TenantByRealmDto {
  @IsDefined()
  realm;
}

interface TenantRouterProps {
  eventService: EventService;
  tenantRepository: TenantRepository;
}

export const createTenantRouter = ({ tenantRepository, eventService }: TenantRouterProps): Router => {
  const tenantRouter = Router();

  async function getTenantByEmail(req, res, next) {
    try {
      const { email } = req.payload;
      const tenant = (await tenantRepository.find({ adminEmailEquals: email }))[0];
      if (!tenant) {
        throw new NotFoundError('Tenant', email);
      }

      res.json(tenant.obj());
    } catch (err) {
      logger.error(`Failed fetching tenant info by email address: ${err.message}`);
      next(err);
    }
  }

  async function getTenantByName(req, res, next) {
    try {
      const { name } = req.payload;

      const tenant = (await tenantRepository.find({ nameEquals: name }))[0];
      if (!tenant) {
        throw new NotFoundError('Tenant', name);
      }

      res.json(tenant.obj());
    } catch (err) {
      logger.error(`Failed fetching tenant info by name: ${err.message}`);
      next(err);
    }
  }

  async function getTenantByRealm(req, res, next) {
    const { realm } = req.payload;

    try {
      const tenant = (await tenantRepository.find({ realmEquals: realm }))[0];
      if (!tenant) {
        throw new NotFoundError('Tenant', realm);
      }

      res.json({
        success: true,
        tenant: tenant.obj(),
      });
    } catch (err) {
      logger.error(`Failed fetching tenant info by realm: ${err.message}`);
      next(err);
    }
  }

  async function getTenant(req, res, next) {
    const { id } = req.payload;

    try {
      const tenant = await tenantRepository.get(id);
      if (!tenant) {
        throw new NotFoundError('Tenant', id);
      }

      res.json({
        success: true,
        tenant: tenant.obj(),
      });
    } catch (err) {
      logger.error(`Failed fetching tenant by id: ${err.message}`);
      next(err);
    }
  }

  async function createTenant(req: Request, res: Response, next) {
    const payload = req['payload'];
    const tenantName = payload.name;
    let realm = payload.realm;
    const email = req.user.email;
    let adminEmail;

    try {
      // check if tenant name exist in
      const tenantInDB = (await tenantRepository.find({ nameEquals: tenantName }))[0];
      if (tenantInDB) {
        throw new InvalidOperationError('Tenant exist, please use another tenant name', tenantName);
      }

      if (realm) {
        if (!req.user.roles.includes(TenantServiceRoles.TenantServiceAdmin)) {
          throw new UnauthorizedError('tenant-service-admin role needed!');
        }
        const testRealm = (await tenantRepository.find({ realmEquals: realm }))[0];
        if (testRealm) {
          throw new InvalidOperationError('Realm has been used, please use another realm name', realm);
        }
        logger.info('Realm exist in request....');
        adminEmail = payload?.adminEmail;

        if (!adminEmail) {
          throw new InvalidOperationError('Please put adminEmail in body');
        }

        const testAdminReal = (await tenantRepository.find({ adminEmailEquals: adminEmail }))[0];
        if (testAdminReal) {
          throw new InvalidOperationError('adminEmail has been used, please use another adminEmail', adminEmail);
        }
      } else {
        //create new realm

        logger.info('Starting create realm on keycloak....');
        await TenantService.validateName(tenantRepository, tenantName);
        realm = uuidv4();

        const [_, clients] = await req.getConfiguration<ServiceClient[]>();

        await TenantService.validateEmailInDB(tenantRepository, email);
        await TenantService.createRealm(clients || [], realm, email, tenantName);
      }

      const { ...tenant } = await TenantService.createNewTenantInDB(
        tenantRepository,
        adminEmail ? adminEmail : email,
        realm,
        tenantName
      );
      const data = { status: 'ok', message: 'Create tenant Success!', realm: realm };

      eventService.send(
        tenantCreated(
          req.user,
          { ...tenant, id: adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}` },
          false
        )
      );
      res.status(HttpStatusCodes.OK).json(data);
    } catch (err) {
      logger.error(`Error creating new tenant ${err.message}`);
      next(err);
    }
  }

  async function getRealmRoles(req, res, next) {
    //TODO: suppose we can use the req.tenant to fetch the realm
    const tenant = req.user.token.iss.split('/').pop();

    try {
      const roles = await TenantService.getRealmRoles(tenant);
      res.json({
        roles: roles,
      });
    } catch (err) {
      logger.error(`Failed to get tenant realm roles with error: ${err.message}`);
      next(err);
    }
  }

  async function deleteTenant(req, res, next) {
    const payload = req.payload;
    const keycloakRealm = payload.realm;

    try {
      const results = await TenantService.deleteTenant(tenantRepository, keycloakRealm);
      res.status(HttpStatusCodes.OK).json({
        success: results.IdPBrokerClient.isDeleted && results.keycloakRealm.isDeleted && results.db.isDeleted,
        ...results,
      });
    } catch (err) {
      // The tenant delete include rescue functions. Serious error occur when reach here.
      logger.error(`Error deleting tenant: ${err.message}`);
      next(err);
    }
  }

  // Tenant admin only APIs. Used by the admin web app.
  tenantRouter.get('/realm/roles', requireTenantAdmin, getRealmRoles);
  tenantRouter.post('/', [requireBetaTesterOrAdmin, validationMiddleware(CreateTenantDto)], createTenant);
  tenantRouter.get('/:id', [validationMiddleware(GetTenantDto)], getTenant);
  tenantRouter.get('/realm/:realm', validationMiddleware(TenantByRealmDto), getTenantByRealm);
  tenantRouter.post('/email', [validationMiddleware(TenantByEmailDto)], getTenantByEmail);
  tenantRouter.post('/name', [validationMiddleware(TenantByNameDto)], getTenantByName);
  tenantRouter.delete('/', [requireTenantServiceAdmin, validationMiddleware(DeleteTenantDto)], deleteTenant);

  return tenantRouter;
};
