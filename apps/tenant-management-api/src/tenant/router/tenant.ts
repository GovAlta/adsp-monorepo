import { Router } from 'express';
import { IsDefined, IsOptional, IsString } from 'class-validator';
import validationMiddleware from '../../middleware/requestValidator';
import {
  requireTenantServiceAdmin,
  requireTenantAdmin,
  requireBetaTesterOrAdmin,
} from '../../middleware/authentication';
import { logger } from '../../middleware/logger';
import { adspId, AuditService, EventService, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { TenantRepository } from '../repository';
import { TenantEntity } from '../models';
import { TenantCriteria } from '../types';
import { NotFoundError } from '@core-services/core-common';
import { mapTenant } from './mappers';
import { RealmService } from '../services/realm';
import { createkcAdminClient } from '../../keycloak';
import { createTenant, archiveTenant } from './tenantV2';
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
  @IsString()
  email: string;
  @IsOptional()
  @IsString()
  realm?: string;
}

class DeleteUserIdpDto {
  @IsDefined()
  @IsString()
  userId: string;
  @IsDefined()
  @IsString()
  realm: string;

  @IsOptional()
  @IsString()
  idpName?: string;
}

class checkDefaultIdpDto {
  @IsDefined()
  userId;
}

interface TenantRouterProps {
  eventService: EventService;
  tenantRepository: TenantRepository;
  realmService: RealmService;
  auditService: AuditService;
}

const rateLimitHandler = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const CORE_REALM = 'core';

// Tenant users can only see their own tenant; core users can see any tenant.
const canAccessTenant = (user: User, tenant: TenantEntity): boolean =>
  user.isCore ||
  user.tenantId?.toString() === adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}`.toString();

// Tenant users can act on their own realm and on the core realm (the webapp links tenant users to core users);
// core users can act on any realm.
const assertRealmAccess = (user: User, realm: string, action: string): void => {
  const userRealm = user.token?.iss?.split('/').pop();
  if (!user.isCore && realm !== CORE_REALM && realm !== userRealm) {
    throw new UnauthorizedUserError(action, user);
  }
};

// Finds the first matching tenant, limited to the caller's own tenant unless the caller is a core user.
// A tenant user without a tenant ID matches nothing: an empty idEquals would be ignored by the repository.
const findAccessibleTenant = async (
  tenantRepository: TenantRepository,
  user: User,
  criteria: TenantCriteria,
): Promise<TenantEntity | undefined> => {
  if (!user.isCore) {
    const ownTenantId = user.tenantId?.resource.replace('/tenants/', '');
    if (!ownTenantId) {
      return undefined;
    }
    criteria = { ...criteria, idEquals: ownTenantId };
  }
  return (await tenantRepository.find({ ...criteria, excludeArchived: true }))[0];
};

export const createTenantRouter = ({
  tenantRepository,
  eventService,
  realmService,
  auditService,
}: TenantRouterProps): Router => {
  const tenantRouter = Router();

  async function getTenantByEmail(req, res, next) {
    try {
      const { email } = req.payload;
      const tenant = await findAccessibleTenant(tenantRepository, req.user, { adminEmailEquals: email });
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

      const tenant = await findAccessibleTenant(tenantRepository, req.user, { nameEquals: name });
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
      const tenant = await findAccessibleTenant(tenantRepository, req.user, { realmEquals: realm });
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
      if (!tenant || tenant.status === 'archived' || !canAccessTenant(req.user, tenant)) {
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
      const archived = await archiveTenant(entity, req.user, realmService, eventService, auditService);
      res.send(mapTenant(archived));
    } catch (err) {
      next(err);
    }
  }

  async function findUserIdByEmailInCore(req, res, next) {
    try {
      const { email } = req.payload;
      const realm = req.payload.realm || CORE_REALM;
      assertRealmAccess(req.user, realm, 'find user');
      const id = await realmService.findUserId(realm, email);
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
      assertRealmAccess(req.user, realm, 'delete user identity provider link');
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
    createTenant(logger, tenantRepository, realmService, eventService, auditService),
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
    findUserIdByEmailInCore,
  );
  tenantRouter.get(
    '/user/default-idp',
    rateLimitHandler,

    requireTenantAdmin,
    [validationMiddleware(checkDefaultIdpDto)],
    checkDefaultInCore,
  );
  tenantRouter.delete(
    '/user/idp',
    rateLimitHandler,
    requireTenantAdmin,
    [validationMiddleware(DeleteUserIdpDto)],
    deleteUserIdp,
  );

  return tenantRouter;
};
