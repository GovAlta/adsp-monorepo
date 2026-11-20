import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request } from 'express';
import { getRequiredTenantId } from './tenant';

describe('getRequiredTenantId', () => {
  it('returns the request tenant id', () => {
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
    expect(getRequiredTenantId({ tenant: { id: tenantId } } as unknown as Request)).toBe(tenantId);
  });

  it('throws InvalidOperationError when there is no tenant', () => {
    expect(() => getRequiredTenantId({} as Request)).toThrow(InvalidOperationError);
  });
});
