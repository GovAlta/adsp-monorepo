import * as TenantModel from '.';
import { createMockMongoServer, disconnect } from '../../../../mongo';

describe('Tenant Entity', () => {
  beforeAll(async () => {
    await createMockMongoServer();
  });

  afterAll(async () => {
    await disconnect();
  });
  const tenant = {
    name: 'mock-tenant-create',
    realm: 'mock',
  };

  it('can create new tenant', async (done) => {
    const result = await TenantModel.create(tenant);
    expect(result).toHaveProperty('id');
    done();
  });

  it('can find the tenant created', async (done) => {
    const name = 'mock-tenant-create';
    const result = await TenantModel.findTenantByName(name);
    expect(result.tenant).toHaveProperty('name', name);
    done();
  });
});
