import { AdspId, adspId, EventService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import {
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
import { tenantCreated, tenantDeleted } from '../events';
import { Tenant, TenantEntity } from '../models';
import { TenantRepository } from '../repository';
import { TenantServiceRoles } from '../roles';
import { RealmService } from '../services/realm';
import { ServiceClient, TenantCriteria } from '../types';
import { mapTenant } from './mappers';
import { validateEmailInDB, validateName } from './utils';

interface TenantRouterProps {
  logger: Logger;
  tenantRepository: TenantRepository;
  realmService: RealmService;
  eventService: EventService;
}

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

      // FIXME: accessing a non-injected dependency makes this hard to test
      const tenants = (await repository.find(criteria)).filter(
        (tenant) =>
          user.isCore || user.tenantId.toString() === `urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}`
      );

      res.send({
        results: tenants.map(mapTenant),
        page: {
          size: tenants.length,
        },
      });
    } catch (err) {
      logger.error(`Failed to get tenants with error: ${err.message}`);
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
      res.send(mapTenant(tenant));
    } catch (err) {
      logger.error(`Failed to get tenant with error: ${err.message}`);
      next(err);
    }
  };
}

export function deleteTenant(
  realmService: RealmService,
  repository: TenantRepository,
  eventService: EventService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { id } = req.params;

      const entity = await repository.get(id);
      if (!entity) {
        throw new NotFoundError('tenant', id);
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
  };
}

export function createTenant(
  logger: Logger,
  tenantRepository: TenantRepository,
  realmService: RealmService,
  eventService: EventService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { name, realm: existingRealm, adminEmail }: New<Tenant> = req.body;

      let realm = existingRealm;
      const email = adminEmail || user.email;

      // Non admins are not permitted to specify realm or admin.
      if ((adminEmail || existingRealm) && !user.roles.includes(TenantServiceRoles.TenantServiceAdmin)) {
        throw new UnauthorizedError('tenant-service-admin role needed!');
      }

      // check for duplicates of name or admin email.
      await validateName(logger, tenantRepository, name);
      await validateEmailInDB(logger, tenantRepository, email);

      if (existingRealm) {
        if (!adminEmail) {
          throw new InvalidOperationError('Please put adminEmail in body');
        }

        const testRealm = (await tenantRepository.find({ realmEquals: existingRealm }))[0];
        if (testRealm) {
          throw new InvalidOperationError(`Realm '${existingRealm}' has been used, please use another realm name`);
        }
        logger.info('Realm exist in request....');
      } else {
        //create new realm
        logger.info('Starting create realm on keycloak....');

        realm = uuidv4();
        const [_, clients] = await req.getConfiguration<ServiceClient[]>();
        await realmService.createRealm(clients || [], { realm, adminEmail: email, name });
      }

      const entity = await TenantEntity.create(tenantRepository, name, realm, email);
      const tenant = mapTenant(entity);

      eventService.send(tenantCreated(user, { ...tenant, id: AdspId.parse(tenant.id) }));
      res.send(tenant);
    } catch (err) {
      logger.error(`Error creating new tenant ${err.message}`);
      next(err);
    }
  };
}

export const createTenantV2Router = ({
  logger,
  realmService,
  tenantRepository,
  eventService,
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
        ['query']
      )
    ),
    getTenants(logger, tenantRepository)
  );
  router.post(
    '/tenants',
    requireBetaTesterOrAdmin,
    createValidationHandler(
      ...checkSchema(
        {
          name: {
            isString: true,
            isLength: { options: { min: 1, max: 50 } },
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
        ['body']
      )
    ),
    createTenant(logger, tenantRepository, realmService, eventService)
  );

  router.get('/tenants/:id', getTenant(logger, tenantRepository));
  router.delete('/tenants/:id', requireTenantServiceAdmin, deleteTenant(realmService, tenantRepository, eventService));

  return router;
};
