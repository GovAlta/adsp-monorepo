import * as TenantModel from '.';

describe('Tenant Entity', () => {
  const tenant = {
    name: 'mock-tenant-create',
    realm: 'mock',
  };

  it.skip('can create new tenant', async (done) => {
    const result = await TenantModel.create(tenant);
    expect(result).toHaveProperty('id');
    done();
  });

  it.skip('can find the tenant created', async (done) => {
    const name = 'mock-tenant-create';
    const result = await TenantModel.findTenantByName(name);
    expect(result.tenant).toHaveProperty('name', name);
    done();
  });
});
