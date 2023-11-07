import { AdspId, adspId, ConfigurationService, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { NotFoundError, createValidationHandler } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { param } from 'express-validator';

export const toTenantName = (nameInUrl: string): string => {
  return nameInUrl.replace(/-/g, ' ');
};

interface ContactInformation {
  contactEmail?: string;
  phoneNumber?: string;
  supportInstructions?: string;
}

async function getContactConfiguration(
  configurationService: ConfigurationService,
  tokenProvider: TokenProvider,
  serviceId: AdspId,
  tenantId: AdspId
): Promise<ContactInformation> {
  const token = await tokenProvider.getAccessToken();
  const [config] = await configurationService.getConfiguration<{ contact: ContactInformation }>(
    serviceId,
    token,
    tenantId
  );

  return config.contact || {};
}

export function getSupportInfo(
  configurationService: ConfigurationService,
  tenantService: TenantService,
  tokenProvider: TokenProvider
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { realm } = req.params;
      const tenant = await tenantService.getTenantByRealm(realm);
      if (!tenant) {
        throw new NotFoundError('Tenant', realm);
      }

      const result = await getContactConfiguration(
        configurationService,
        tokenProvider,
        adspId`urn:ads:platform:notification-service`,
        tenant.id
      );

      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export function getSupportInfoTenantId(
  configurationService: ConfigurationService,
  tenantService: TenantService,
  tokenProvider: TokenProvider
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { tenantId } = req.params;
      const tenant = await tenantService.getTenant(
        adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenantId as string}`
      );
      if (!tenant) {
        throw new NotFoundError('Tenant', tenantId);
      }

      const result = await getContactConfiguration(
        configurationService,
        tokenProvider,
        adspId`urn:ads:platform:notification-service`,
        tenant.id
      );

      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export function getStatusSupportInfo(
  configurationService: ConfigurationService,
  tenantService: TenantService,
  tokenProvider: TokenProvider
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { name } = req.params;
      const tenant = await tenantService.getTenantByName(toTenantName(name));
      if (!tenant) {
        throw new NotFoundError('Tenant', name);
      }

      const result = await getContactConfiguration(
        configurationService,
        tokenProvider,
        adspId`urn:ads:platform:status-service`,
        tenant.id
      );

      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

interface RouterProps {
  configurationService: ConfigurationService;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
}

export const createConfigurationRouter = ({
  configurationService,
  tenantService,
  tokenProvider,
}: RouterProps): Router => {
  const router = Router();

  router.get(
    '/support-info/:realm',
    // due to some history issue, the realm and tenant name formats are not consisted.
    createValidationHandler(param('realm').isLength({ min: 2 })),
    getSupportInfo(configurationService, tenantService, tokenProvider)
  );
  router.get(
    '/support-info-tenant-id/:tenantId',
    createValidationHandler(param('tenantId').isMongoId()),
    getSupportInfoTenantId(configurationService, tenantService, tokenProvider)
  );
  router.get(
    '/status-support-info/:name',
    createValidationHandler(param('name').isLength({ min: 2 })),
    getStatusSupportInfo(configurationService, tenantService, tokenProvider)
  );

  return router;
};
