import * as TenantModel from '.';
import { connectMongo, disconnect } from '../../../../mongo';
import { connection } from 'mongoose';

describe('Tenant Entity', () => {
  beforeAll(async () => {
    connectMongo(true);
  });

  afterAll(async () => {
    const collections = await connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
    disconnect();
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
