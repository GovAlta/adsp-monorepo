import { createTenantService, getRequestedTenant } from './index';
import { getRequestedTenant as getRequestedTenantImpl } from './requestedTenant';
import { TenantServiceImpl } from './tenantService';

jest.mock('./tenantService', () => ({
  TenantServiceImpl: jest.fn(),
}));

describe('tenant', () => {
  it('can create tenant service', () => {
    const options = { directory: {}, tokenProvider: {}, logger: {} } as unknown as Parameters<typeof createTenantService>[0];

    const service = createTenantService(options);

    expect(service).toBeInstanceOf(TenantServiceImpl);
    expect(TenantServiceImpl).toHaveBeenCalledWith(options.logger, options.directory, options.tokenProvider);
  });

  it('can export getRequestedTenant', () => {
    expect(getRequestedTenant).toBe(getRequestedTenantImpl);
  });
});
