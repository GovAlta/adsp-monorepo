import { AdspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request } from 'express';

// Core users can call tenant-scoped routes without a tenantId, which leaves req.tenant unset.
export const getRequiredTenantId = (req: Request): AdspId => {
  if (!req.tenant?.id) {
    throw new InvalidOperationError('Tenant context is required for operation.');
  }
  return req.tenant.id;
};
