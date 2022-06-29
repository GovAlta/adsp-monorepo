import { Router } from 'express';
import { IsDefined } from 'class-validator';
import validationMiddleware from '../../middleware/requestValidator';
import {
  requireTenantServiceAdmin,
  requireTenantAdmin,
  requireBetaTesterOrAdmin,
} from '../../middleware/authentication';
import { logger } from '../../middleware/logger';
import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import { TenantRepository } from '../repository';
import { NotFoundError } from '@core-services/core-common';
import { mapTenant } from './mappers';
import { RealmService } from '../services/realm';
import { createkcAdminClient } from '../../keycloak';
import { createTenant } from './tenantV2';
import { tenantDeleted } from '../events';

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
  realmService: RealmService;
}

export const createTenantRouter = ({ tenantRepository, eventService, realmService }: TenantRouterProps): Router => {
  const tenantRouter = Router();

  async function getTenantByEmail(req, res, next) {
    try {
      const { email } = req.payload;
      const tenant = (await tenantRepository.find({ adminEmailEquals: email }))[0];
      if (!tenant) {
        throw new NotFoundError('Tenant', email);
      }

      res.json(mapTenant(tenant));
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

      res.json(mapTenant(tenant));
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
        tenant: mapTenant(tenant),
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
        tenant: mapTenant(tenant),
      });
    } catch (err) {
      logger.error(`Failed fetching tenant by id: ${err.message}`);
      next(err);
    }
  }

  async function getRealmRoles(req, res, next) {
    //TODO: suppose we can use the req.tenant to fetch the realm
    const realm = req.user.token.iss.split('/').pop();

    try {
      const client = await createkcAdminClient();
      const roles = await client.roles.find({ realm });
      res.json({
        roles: roles,
      });
    } catch (err) {
      logger.error(`Failed to get tenant realm roles with error: ${err.message}`);
      next(err);
    }
  }

  async function deleteTenant(req, res, next) {
    try {
      const { realm } = req['payload'];

      const [entity] = await tenantRepository.find({ realmEquals: realm });
      if (!entity) {
        throw new NotFoundError('tenant', `realm: ${realm}`);
      }
      const tenant = mapTenant(entity);

      const deletedRealm = await realmService.deleteRealm(entity);
      const deletedTenant = await entity.delete();
      const success = deletedRealm && deletedTenant;

      if (success) {
        eventService.send(tenantDeleted(req.user, { ...tenant, id: AdspId.parse(tenant.id) }));
      }
      res.send({ deletedRealm, deletedTenant, success });
    } catch (err) {
      next(err);
    }
  }

  // Tenant admin only APIs. Used by the admin web app.
  tenantRouter.post(
    '/',
    [requireBetaTesterOrAdmin, validationMiddleware(CreateTenantDto)],
    createTenant(logger, tenantRepository, realmService, eventService)
  );
  tenantRouter.get('/:id', [validationMiddleware(GetTenantDto)], getTenant);
  tenantRouter.delete('/', [requireTenantServiceAdmin, validationMiddleware(DeleteTenantDto)], deleteTenant);

  tenantRouter.get('/realm/roles', requireTenantAdmin, getRealmRoles);
  tenantRouter.get('/realm/:realm', validationMiddleware(TenantByRealmDto), getTenantByRealm);
  tenantRouter.post('/email', [validationMiddleware(TenantByEmailDto)], getTenantByEmail);
  tenantRouter.post('/name', [validationMiddleware(TenantByNameDto)], getTenantByName);

  return tenantRouter;
};
