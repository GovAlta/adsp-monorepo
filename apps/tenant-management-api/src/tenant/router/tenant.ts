import { Router } from 'express';
import { IsDefined, IsOptional } from 'class-validator';
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
import { rateLimit } from 'express-rate-limit';

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

class FindUserIdByEmailDto {
  @IsDefined()
  email;
  @IsOptional()
  realm;
}

class DeleteUserIdpDto {
  @IsDefined()
  userId;
  @IsDefined()
  realm;

  @IsOptional()
  idpName;
}

class checkDefaultIdpDto {
  @IsDefined()
  userId;
}

interface TenantRouterProps {
  eventService: EventService;
  tenantRepository: TenantRepository;
  realmService: RealmService;
}

const rateLimitHandler = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

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
      logger.info(`Start to fetch ${realm} realm roles`);
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

  async function findUserIdByEmailInCore(req, res, next) {
    try {
      const { email, realm } = req.payload;
      const id = await realmService.findUserId(realm || 'core', email);
      res.json({
        userIdInCore: id,
      });
    } catch (err) {
      next(err);
    }
  }

  async function deleteUserIdp(req, res, next) {
    try {
      const { userId, realm, idpName } = req.payload;
      await realmService.deleteUserIdp(userId, realm, idpName);
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  }

  async function checkDefaultInCore(req, res, next) {
    try {
      const { userId } = req.payload;
      const hasDefaultIdpInCore = await realmService.checkUserDefaultIdpInCore(userId);
      res.json({
        hasDefaultIdpInCore,
      });
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
  tenantRouter.get(
    '/user/id',
    rateLimitHandler,
    requireTenantAdmin,
    [validationMiddleware(FindUserIdByEmailDto)],
    findUserIdByEmailInCore
  );
  tenantRouter.get(
    '/user/default-idp',
    rateLimitHandler,

    requireTenantAdmin,
    [validationMiddleware(checkDefaultIdpDto)],
    checkDefaultInCore
  );
  tenantRouter.delete(
    '/user/idp',
    rateLimitHandler,
    requireTenantAdmin,
    [validationMiddleware(DeleteUserIdpDto)],
    deleteUserIdp
  );

  return tenantRouter;
};
