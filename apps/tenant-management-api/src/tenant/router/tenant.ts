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

  async function getTenantByEmail(req, res) {
    try {
      const { email } = req.payload;
      console.log(JSON.stringify(req.payload) + "<params");
      console.log(JSON.stringify(req.payload.email) + "<email");
      console.log(JSON.stringify(req.payload.name) + "<name");
      const tenant = await tenantRepository.findBy({ adminEmail: email });
      res.json(tenant.obj());
    } catch (e) {
      res.status(HttpStatusCodes.NOT_FOUND).json();
    }
  }

  async function getTenantByName(req, res) {
    try {
      console.log("getbyname");
      console.log(JSON.stringify(req.payload) + "<params");
      const { name } = req.payload;
      console.log(JSON.stringify(name) + "<name");
      const tenant = await tenantRepository.findBy({ name: name });
      console.log(JSON.stringify(tenant) + "<tenant");
      res.json(tenant.obj());
    } catch (e) {
      res.status(HttpStatusCodes.NOT_FOUND).json();
    }
  }


  async function getTenantByRealm(req, res) {
    const { realm } = req.payload;

    try {
      const tenant = await tenantRepository.findBy({ realm });
      res.json({
        success: true,
        tenant: tenant.obj(),
      });
    } catch (e) {
      logger.error(`Failed to get tenant by realm: ${e.message}`);
      res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        errors: [e.message],
      });
    }
  }

  async function fetchIssuers(req, res) {
    const issuers = await tenantRepository.issuers();
    if (issuers) {
      res.json(issuers);
    } else {
      res.status(HttpStatusCodes.BAD_REQUEST).json();
    }
  }

  async function fetchRealmTenantMapping(req, res) {
    const mapping = await tenantRepository.fetchRealmToNameMapping();
    if (mapping) {
      res.json(mapping);
    } else {
      res.status(HttpStatusCodes.BAD_REQUEST);
    }
  }

  async function getTenant(req, res) {
    const { id } = req.payload;

    try {
      const tenant = await tenantRepository.findBy({ id });
      res.json({
        success: true,
        tenant: tenant.obj(),
      });
    } catch (e) {
      logger.error(`Failed to get tenant by id: ${e.message}`);
      res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        errors: [e.message],
      });
    }
  }

  async function createTenant(req: Request, res: Response) {
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
          throw new TenantService.TenantError(`${tenantName} does not exit`, HttpStatusCodes.BAD_REQUEST);
        }
        const tenantRealm = tenantName;
        logger.info(`Found key realm with name ${tenantRealm}`);
        // For existed tenant, realm is same as tenant name
        const hasTenant = await TenantService.hasTenantOfRealm(tenantName);

        if (hasTenant) {
          throw new TenantService.TenantError(
            `Tenant ${tenantName} has already been created`,
            HttpStatusCodes.BAD_REQUEST
          );
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
      if (err instanceof TenantService.TenantError) {
        res.status(err.errorCode).json({ error: err.message });
      } else {
        res.status(err.response.status).json({ error: err.message });
      }
    }
  }

  async function deleteTenant(req, res) {
    const payload = req.payload;
    const keycloakRealm = payload.realm;

    try {
      const results = await TenantService.deleteTenant(tenantRepository, keycloakRealm);
      res.status(HttpStatusCodes.OK).json({
        success: results.IdPBrokerClient.isDeleted && results.keycloakRealm.isDeleted && results.db.isDeleted,
        ...results,
      });
    } catch (err) {
      if (err instanceof TenantService.TenantError) {
        res.status(err.errorCode).json({ error: err.message });
      } else {
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
      }
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

  /**
   * @deprecated Used for issuers cache and mappings to tenants.
   */
  tenantRouter.get('/issuers', requireTenantServiceAdmin, fetchIssuers);
  tenantRouter.get('/realm/roles', requireTenantAdmin, getRealmRoles);
  tenantRouter.get('/realms/names', requireTenantServiceAdmin, fetchRealmTenantMapping);

  // Tenant admin only APIs
  // Used by the admin web app.
  tenantRouter.post('/', [requireBetaTesterOrAdmin, validationMiddleware(CreateTenantDto)], createTenant);
  tenantRouter.get('/:id', [validationMiddleware(GetTenantDto)], getTenant);
  tenantRouter.get('/realm/:realm', validationMiddleware(TenantByRealmDto), getTenantByRealm);
  tenantRouter.post('/email', [validationMiddleware(TenantByEmailDto)], getTenantByEmail);
  tenantRouter.post('/name', [validationMiddleware(TenantByNameDto)], getTenantByName);
  tenantRouter.delete('/', [requireTenantServiceAdmin, validationMiddleware(DeleteTenantDto)], deleteTenant);

  return tenantRouter;
};
