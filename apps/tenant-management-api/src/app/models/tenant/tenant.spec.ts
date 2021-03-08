import * as TenantModel from '.';
import { createMockMongoServer, disconnect } from '../../../mongo';
import * as UserModel from '../user';
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
    createdBy: null,
    adminEmail: 'mock-admin@gov.ab.ca',
    tokenIssuer: 'http://mock-issuer@gov.ab.ca',
  };

  it('can create new tenant', async (done) => {
    const newUser = {
      email: 'mock-admin@gov.ab.ca',
      username: 'mock-admin',
    };
    const user = await UserModel.create(newUser);
    tenant.createdBy = user.id;
    const result = await TenantModel.create(tenant);
    expect(result).toHaveProperty('id');
    done();
  });

  it('can find the tenant created by name', async (done) => {
    const name = 'mock-tenant-create';
    const result = await TenantModel.findTenantByName(name);
    expect(result.tenant).toHaveProperty('name', name);
    done();
  });

  it('can find the tenant created by email', async (done) => {
    const email = 'mock-admin@gov.ab.ca';
    const result = await TenantModel.findTenantByEmail(email);
    expect(result.tenant).toHaveProperty('adminEmail', email);
    done();
  });

  it('can validate the token issuer', async (done) => {
    const result = await TenantModel.validateTenantIssuer(tenant.tokenIssuer);
    expect(result.isValid).toEqual(true);
    done();
  });

  it('can get all issuers', async (done) => {
    const result = await TenantModel.fetchIssuers();
    expect(result.issuers).toContain(tenant.tokenIssuer);
    done();
  });

  it('can delete the tenant created', async (done) => {
    const name = 'mock-tenant-create';
    const result = await TenantModel.deleteTenantByName(name);
    expect(result.success).toEqual(true);
    done();
  });
});
