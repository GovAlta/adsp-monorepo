import { AdspId, adspId, AuditService, EventService, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  New,
  NotFoundError,
  UnauthorizedError,
} from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { checkSchema } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { requireBetaTesterOrAdmin, requireTenantServiceAdmin } from '../../middleware/authentication';
import {
  TenantCreatedAuditAction,
  TenantDeletedAuditAction,
  TenantUpdatedAuditAction,
  toTenantAuditDetails,
} from '../audit';
import { tenantCreated, tenantDeleted, tenantNameUpdated } from '../events';
import { Tenant, TenantEntity } from '../models';
import { TenantRepository } from '../repository';
import { TenantServiceRoles } from '../roles';
import { RealmService } from '../services/realm';
import { ServiceClient, TenantCriteria } from '../types';
import { mapTenant } from './mappers';
import { validateEmailInDB, validateName } from './utils';
import { rateLimit } from 'express-rate-limit';

interface TenantRouterProps {
  logger: Logger;
  tenantRepository: TenantRepository;
  realmService: RealmService;
  eventService: EventService;
  auditService: AuditService;
}

const LOG_CONTEXT = { context: 'TenantRouter' };

const rateLimitHandler = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export function getTenants(logger: Logger, repository: TenantRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { name, realm, adminEmail } = req.query;
      const criteria: TenantCriteria = {};
      if (name) {
        criteria.nameEquals = `${name}`;
      }

      if (realm) {
        criteria.realmEquals = `${realm}`;
      }

      if (adminEmail) {
        criteria.adminEmailEquals = `${adminEmail}`;
      }

      if (user?.tenantId) {
        criteria.idEquals = user.tenantId.resource.replace('/tenants/', '');
      }

      // For anonymous users, the supported operation is a query including name OR realm id criteria.
      if (!user && !criteria.nameEquals && !criteria.nameEquals && !criteria.realmEquals) {
        throw new UnauthorizedError('Request must include realm id or name criteria.');
      }

      // FIXME: accessing a non-injected dependency makes this hard to test
      const tenants = await repository.find({ ...criteria, activeOnly: true });

      res.send({
        results: tenants.map((tenant) => mapTenant(tenant, !user)),
        page: {
          size: tenants.length,
        },
      });
    } catch (err) {
      logger.error(`Failed to get tenants with error: ${err.message}`, LOG_CONTEXT);
      next(err);
    }
  };
}

export function getTenant(logger: Logger, repository: TenantRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { id } = req.params;

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/${id}`;
      if (!user.isCore && user.tenantId.toString() !== tenantId.toString()) {
        throw new UnauthorizedUserError('get tenant', user);
      }

      const tenant = await repository.get(id);
      if (!tenant) {
        throw new NotFoundError('tenant', id);
      }

      res.send(mapTenant(tenant));
    } catch (err) {
      logger.error(`Failed to get tenant with error: ${err.message}`, LOG_CONTEXT);
      next(err);
    }
  };
}

export function updateTenantName(
  logger: Logger,
  repository: TenantRepository,
  eventService: EventService,
  auditService: AuditService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { name } = req.body;

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/${id}`;
      if (!user.isCore && user.tenantId.toString() !== tenantId.toString()) {
        throw new UnauthorizedUserError('get tenant', user);
      }

      const tenant = await repository.get(id);

      if (!tenant) {
        throw new NotFoundError('tenant', id);
      }
      const previousName = tenant.name;
      tenant.name = name;
      const newTenant = await repository.save(tenant);

      if (newTenant) {
        eventService.send(tenantNameUpdated(req.user, { ...newTenant, id: AdspId.parse(mapTenant(newTenant).id) }));
        void auditService.record(
          TenantUpdatedAuditAction,
          toTenantAuditDetails(user, mapTenant(tenant), {
            changeSet: { before: { name: previousName }, after: { name } },
          }),
        );
      }

      res.send(mapTenant(tenant));
    } catch (err) {
      logger.error(`Failed to update tenant name with error: ${err.message}`, LOG_CONTEXT);
      next(err);
    }
  };
}

export interface TenantRemovalResult {
  deletedRealm: boolean;
  deletedTenant: boolean;
  success: boolean;
}

/**
 * Deletes the tenant realm and record, auditing the deletion.
 *
 * The audit service resolves the tenant of each event, so the deletion is recorded before the tenant is removed;
 * a follow-up failure or error event is recorded if the removal does not fully succeed.
 */
export async function removeTenant(
  entity: TenantEntity,
  user: User,
  realmService: RealmService,
  auditService: AuditService,
): Promise<TenantRemovalResult> {
  const tenant = mapTenant(entity);
  await auditService.record(TenantDeletedAuditAction, toTenantAuditDetails(user, tenant));

  let deletedRealm: boolean;
  let deletedTenant: boolean;
  try {
    deletedRealm = await realmService.deleteRealm(entity);
    deletedTenant = await entity.delete();
  } catch (err) {
    void auditService.record(
      TenantDeletedAuditAction,
      toTenantAuditDetails(user, tenant, {
        status: 'error',
        metadata: { error: err.message },
      }),
    );
    throw err;
  }

  const success = !!(deletedRealm && deletedTenant);
  if (!success) {
    void auditService.record(
      TenantDeletedAuditAction,
      toTenantAuditDetails(user, tenant, {
        status: 'failure',
        metadata: { deletedRealm: !!deletedRealm, deletedTenant: !!deletedTenant },
      }),
    );
  }

  return { deletedRealm, deletedTenant, success };
}

export function deleteTenant(
  realmService: RealmService,
  repository: TenantRepository,
  eventService: EventService,
  auditService: AuditService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { id } = req.params;

      const entity = await repository.get(id);
      if (!entity) {
        throw new NotFoundError('tenant', id);
      }
      const tenant = mapTenant(entity);

      const { deletedRealm, deletedTenant, success } = await removeTenant(entity, req.user, realmService, auditService);

      if (deletedTenant) {
        eventService.send(tenantDeleted(req.user, { ...tenant, id: AdspId.parse(tenant.id) }));
      }
      res.send({ deletedRealm, deletedTenant, success });
    } catch (err) {
      next(err);
    }
  };
}

async function provisionRealm(
  entity: TenantEntity,
  clients: ServiceClient[],
  realmService: RealmService,
  eventService: EventService,
  auditService: AuditService,
  user: User,
  logger: Logger,
): Promise<void> {
  try {
    await realmService.createRealm(clients, { realm: entity.realm, adminEmail: entity.adminEmail, name: entity.name });
    entity.status = 'active';
    await entity.save();
    const tenant = mapTenant(entity);
    eventService.send(tenantCreated(user, { ...tenant, id: AdspId.parse(tenant.id) }));
    logger.info(`Provisioned tenant '${entity.name}' with realm '${entity.realm}'.`, LOG_CONTEXT);

    await auditService.record(
      TenantCreatedAuditAction,
      toTenantAuditDetails(user, tenant, {
        metadata: { realmProvisioning: 'new', serviceClientCount: clients.length },
      }),
    );
  } catch (err) {
    logger.error(
      `Failed to provision tenant '${entity.name}': ${err.message}${err.responseData ? ` — KC: ${JSON.stringify(err.responseData)}` : ''}`,
      LOG_CONTEXT,
    );
    // Recorded before the tenant record is removed, since the audit service resolves the tenant of each event.
    await auditService.record(
      TenantCreatedAuditAction,
      toTenantAuditDetails(user, mapTenant(entity), {
        status: 'failure',
        metadata: { realmProvisioning: 'new', error: err.message },
      }),
    );
    try {
      await realmService.deleteRealm(entity);
    } catch (deleteErr) {
      logger.error(`Failed to cleanup realm for '${entity.name}': ${deleteErr.message}`, LOG_CONTEXT);
    }
    await entity.delete();
  }
}

export function createTenant(
  logger: Logger,
  tenantRepository: TenantRepository,
  realmService: RealmService,
  eventService: EventService,
  auditService: AuditService,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { name, realm: existingRealm, adminEmail }: New<Tenant> = req.body;

      const email = adminEmail || user.email;

      // Non admins are not permitted to specify realm or admin.
      if ((adminEmail || existingRealm) && !user.roles.includes(TenantServiceRoles.TenantServiceAdmin)) {
        throw new UnauthorizedError('tenant-service-admin role needed!');
      }

      // check for duplicates of name or admin email.
      await validateName(logger, tenantRepository, name);

      if (!user.roles.includes(TenantServiceRoles.TenantServiceAdmin)) {
        await validateEmailInDB(logger, tenantRepository, email);
      }

      if (existingRealm) {
        if (!adminEmail) {
          throw new InvalidOperationError('Administrator email not specified.');
        }

        const [testRealm] = await tenantRepository.find({ realmEquals: existingRealm });
        if (testRealm) {
          throw new InvalidOperationError(`Realm '${existingRealm}' associated to existing tenant: ${testRealm.name}`);
        }
        logger.info(
          `Creating tenant '${name}' with existing realm '${existingRealm}' for admin ${email}...`,
          LOG_CONTEXT,
        );

        const entity = await TenantEntity.create(tenantRepository, name, existingRealm, email);
        const tenant = mapTenant(entity);
        eventService.send(tenantCreated(user, { ...tenant, id: AdspId.parse(tenant.id) }));
        void auditService.record(
          TenantCreatedAuditAction,
          toTenantAuditDetails(user, tenant, {
            metadata: { realmProvisioning: 'existing' },
          }),
        );
        logger.info(`Created tenant '${name}' with existing realm '${existingRealm}' for admin ${email}.`, LOG_CONTEXT);
        res.send(tenant);
      } else {
        logger.info(`Creating tenant '${name}' with new realm for admin ${email}...`, LOG_CONTEXT);

        const realm = uuidv4();
        const [_, clients] = await req.getConfiguration<ServiceClient[]>();

        const entity = await TenantEntity.create(tenantRepository, name, realm, email, 'provisioning');
        const tenant = mapTenant(entity);

        res.status(202).send(tenant);

        provisionRealm(entity, clients || [], realmService, eventService, auditService, user, logger).catch((err) => {
          logger.error(`Unhandled error during tenant provisioning: ${err.message}`, LOG_CONTEXT);
        });
      }
    } catch (err) {
      logger.error(`Error creating new tenant ${err.message}`, LOG_CONTEXT);
      next(err);
    }
  };
}

export const createTenantV2Router = ({
  logger,
  realmService,
  tenantRepository,
  eventService,
  auditService,
}: TenantRouterProps): Router => {
  const router: Router = Router();

  router.get(
    '/tenants',
    createValidationHandler(
      ...checkSchema(
        {
          name: {
            optional: true,
            isString: true,
            isLength: { options: { min: 1, max: 50 } },
          },
          realm: {
            optional: true,
            isString: true,
            isLength: { options: { min: 1, max: 50 } },
          },
          adminEmail: {
            optional: true,
            isEmail: true,
          },
        },
        ['query'],
      ),
    ),
    getTenants(logger, tenantRepository),
  );
  router.post(
    '/tenants',
    assertAuthenticatedHandler,
    requireBetaTesterOrAdmin,
    createValidationHandler(
      ...checkSchema(
        {
          name: {
            isString: true,
            isLength: { options: { min: 1, max: 50 } },
            matches: { options: /^[0-9a-zA-Z _]{1,50}$/ },
          },
          realm: {
            optional: { options: { nullable: true } },
            isString: true,
            isLength: { options: { min: 1, max: 50 } },
          },
          adminEmail: {
            optional: { options: { nullable: true } },
            isEmail: true,
          },
        },
        ['body'],
      ),
    ),
    createTenant(logger, tenantRepository, realmService, eventService, auditService),
  );

  router.get('/tenants/:id', assertAuthenticatedHandler, getTenant(logger, tenantRepository));
  router.delete(
    '/tenants/:id',
    assertAuthenticatedHandler,
    requireTenantServiceAdmin,
    deleteTenant(realmService, tenantRepository, eventService, auditService),
  );

  router.patch(
    '/tenants/:id/name',
    rateLimitHandler,
    assertAuthenticatedHandler,
    requireTenantServiceAdmin,
    createValidationHandler(
      ...checkSchema(
        {
          name: {
            isString: true,
            isLength: { options: { min: 1, max: 50 } },
            matches: { options: /^[0-9a-zA-Z _]{1,50}$/ },
          },
        },
        ['body'],
      ),
    ),
    updateTenantName(logger, tenantRepository, eventService, auditService),
  );

  return router;
};
