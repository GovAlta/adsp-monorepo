import axios from 'axios';
import { AdspId, AdspIdFormatError } from '../utils';
import type { Tenant, TenantService } from './tenantService';

// Tenant IDs are tenant-service resources of the form urn:ads:platform:tenant-service:v2:/tenants/{objectId}.
const TenantResourcePattern = /^\/tenants\/[a-f0-9]{24}$/i;

/**
 * Resolves a tenant from a caller supplied tenantId (e.g. a query parameter). A value that is not a
 * tenant URN, or that does not identify a known tenant, is the caller's mistake and fails with
 * AdspIdFormatError (400) rather than surfacing the lookup failure as a 500.
 */
export async function getRequestedTenant(service: TenantService, value: unknown): Promise<Tenant> {
  if (typeof value !== 'string') {
    throw new AdspIdFormatError('tenantId must be a single tenant URN.');
  }

  const tenantId = AdspId.parse(value);
  if (
    tenantId.type !== 'resource' ||
    tenantId.namespace !== 'platform' ||
    tenantId.service !== 'tenant-service' ||
    !TenantResourcePattern.test(tenantId.resource)
  ) {
    throw new AdspIdFormatError(`tenantId must be a tenant URN: ${value}`);
  }

  let tenant: Tenant;
  try {
    tenant = await service.getTenant(tenantId);
  } catch (err) {
    const isTenantNotFound =
      axios.isAxiosError(err) && err.response?.status === 404 && `${err.config?.url}`.includes(tenantId.resource);
    if (!isTenantNotFound) {
      throw err;
    }
  }

  if (!tenant) {
    throw new AdspIdFormatError(`tenantId does not identify a known tenant: ${value}`);
  }
  return tenant;
}
