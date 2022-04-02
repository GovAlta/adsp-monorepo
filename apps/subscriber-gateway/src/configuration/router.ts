import { adspId, ServiceDirectory, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';

export const toTenantName = (nameInUrl: string): string => {
  return nameInUrl.replace(/-/g, ' ');
};

export function getSupportInfo(
  tenantService: TenantService,
  tokenProvider: TokenProvider,
  directory: ServiceDirectory
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { realm } = req.params;
      const tenant = await tenantService.getTenantByRealm(realm);
      if (!tenant) {
        throw new NotFoundError('Tenant', realm);
      }
      const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
      const token = await tokenProvider.getAccessToken();
      const subscribersUrl = new URL(
        `/configuration/v2/configuration/platform/notification-service?tenantId=${tenant.id}`,
        configurationServiceUrl
      );
      const { data } = await axios.get(subscribersUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.send(data.latest?.configuration?.contact);
    } catch (err) {
      next(err);
    }
  };
}

export function getSupportInfoTenantId(
  tenantService: TenantService,
  tokenProvider: TokenProvider,
  directory: ServiceDirectory
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
      const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
      const token = await tokenProvider.getAccessToken();
      const subscribersUrl = new URL(
        `/configuration/v2/configuration/platform/notification-service?tenantId=${tenant.id}`,
        configurationServiceUrl
      );
      const { data } = await axios.get(subscribersUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.send(data.latest?.configuration?.contact);
    } catch (err) {
      next(err);
    }
  };
}

export function getStatusSupportInfo(
  tenantService: TenantService,
  tokenProvider: TokenProvider,
  directory: ServiceDirectory
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { name } = req.params;
      const tenant = await tenantService.getTenantByName(toTenantName(name));
      if (!tenant) {
        throw new NotFoundError('Tenant', name);
      }
      const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
      const token = await tokenProvider.getAccessToken();
      const subscribersUrl = new URL(
        `/configuration/v2/configuration/platform/status-service?tenantId=${tenant.id}`,
        configurationServiceUrl
      );
      const { data } = await axios.get(subscribersUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.send(data.latest?.configuration?.contact);
    } catch (err) {
      next(err);
    }
  };
}

interface RouterProps {
  directory: ServiceDirectory;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
}

export const createConfigurationRouter = ({ tenantService, tokenProvider, directory }: RouterProps): Router => {
  const router = Router();

  router.get('/support-info/:realm', getSupportInfo(tenantService, tokenProvider, directory));
  router.get('/support-info-tenant-id/:tenantId', getSupportInfoTenantId(tenantService, tokenProvider, directory));
  router.get('/status-support-info/:name', getStatusSupportInfo(tenantService, tokenProvider, directory));

  return router;
};
