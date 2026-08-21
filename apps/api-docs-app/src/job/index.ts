import { TenantService, adspId, toKebabName } from '@abgov/adsp-service-sdk';

import { Logger } from 'winston';
import { ServiceDocs } from '../docs/serviceDocs';

interface FetchJobProps {
  logger: Logger;
  serviceDocs: ServiceDocs;
  tenantService: TenantService;
}

export const createFetchJob =
  ({ logger, serviceDocs, tenantService }: FetchJobProps) =>
  async () => {
    try {
      logger.info('Starting fetch api docs and put into cache');
      const tenants = await tenantService.getTenants();
      await Promise.all(
        tenants.map((tenant) => serviceDocs.refresh(adspId`urn:ads:${toKebabName(tenant.name)}`))
      );
      logger.info('Ending fetch api docs and put into cache');
    } catch (err) {
      const errMessage = `Error getting notices: ${err.message}`;
      logger.error(errMessage);
    }
  };
