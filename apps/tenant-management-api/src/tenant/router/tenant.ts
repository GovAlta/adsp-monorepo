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
import { EventService } from '@abgov/adsp-service-sdk';
import { tenantCreated } from '../events';
import { TenantRepository } from '../repository';
import { ServiceClient } from '../types';
import { InvalidOperationError } from '@core-services/core-common';

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
      const tenant = await tenantRepository.findBy({ adminEmail: email });
      res.json(tenant.obj());
    } catch (err) {
      logger.error(`Failed fetching tenant info by email address: ${err.message}`);
      next(err);
    }
  }

  async function getTenantByName(req, res, next) {
    try {
      const { name } = req.payload;

      const tenant = await tenantRepository.findBy({ name: { $regex: '^' + name + '\\b', $options: 'i' } });
      res.json(tenant.obj());
    } catch (err) {
      logger.error(`Failed fetching tenant info by name: ${err.message}`);
      next(err);
    }
  }

  async function getTenantByRealm(req, res, next) {
    const { realm } = req.payload;

    try {
      const tenant = await tenantRepository.findBy({ realm });
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
      const tenant = await tenantRepository.findBy({ id });
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
    const email = req.user.email;

    let tokenIssuer = req.user.token.iss;
    tokenIssuer = tokenIssuer.replace('core', tenantName);

    try {
      const tenantEmail = payload?.email;
      if (tenantEmail) {
        const hasRealm = await TenantService.isRealmExisted(tenantName);
        // To upgrade existing realm to support platform team service. Email is from the payload
        if (!hasRealm) {
          const message = `${tenantName} does not exit`;
          throw new InvalidOperationError(message);
        }
        const tenantRealm = tenantName;
        logger.info(`Found key realm with name ${tenantRealm}`);
        // For existed tenant, realm is same as tenant name
        const hasTenant = await TenantService.hasTenantOfRealm(tenantName);

        if (hasTenant) {
          const message = `Duplicated tenant.`;
          throw new InvalidOperationError(message);
        }

        await TenantService.validateEmailInDB(tenantRepository, tenantEmail);
        const { ...tenant } = await TenantService.createNewTenantInDB(
          tenantRepository,
          tenantEmail,
          tenantName,
          tenantName,
          tokenIssuer
        );

        const response = { ...tenant, newTenant: false };
        eventService.send(tenantCreated(req.user, response, false));
        res.status(HttpStatusCodes.OK).json(response);
      }

      logger.info('Starting create realm....');

      await TenantService.validateName(tenantRepository, tenantName);

      const generatedRealmName = uuidv4();

      const [_, clients] = await req.getConfiguration<ServiceClient[], ServiceClient[]>();
      await TenantService.validateEmailInDB(tenantRepository, email);
      await TenantService.createRealm(clients || [], generatedRealmName, email, tenantName);
      const { ...tenant } = await TenantService.createNewTenantInDB(
        tenantRepository,
        email,
        generatedRealmName,
        tenantName,
        tokenIssuer
      );

      const data = { status: 'ok', message: 'Create Realm Success!', realm: generatedRealmName };
      eventService.send(tenantCreated(req.user, { ...tenant }, true));
      res.status(HttpStatusCodes.OK).json(data);
    } catch (err) {
      logger.error(`Error creating new tenant ${err.message}`);
      res.status(err.response?.status || err.errorCode || 400).json({ error: err.message });
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
      // The tenant delete include rescure functions. Serious error occur when reach here.
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
