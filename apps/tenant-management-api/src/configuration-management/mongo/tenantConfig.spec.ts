import { MongoTenantConfigurationRepository } from './tenantConfig';
import { connect, disconnect, createMockData } from '@core-services/core-common';
import { TenantConfigEntity } from '../configuration';

describe('Mongo: TenantConfig', () => {
  const repo = new MongoTenantConfigurationRepository();

  beforeEach(async (done) => {
    await connect();
    done();
  });

  afterEach(async (done) => {
    await disconnect();
    done();
  });

  it('should create an option', async () => {
    const data = await createMockData<TenantConfigEntity>(repo, [{}]);
    const { results } = await repo.find(99, '');
    expect(results.length).toEqual(data.length);
  });

  it('finds a defined record count ', async () => {
    const data = await createMockData<TenantConfigEntity>(repo, [{}, {}, {}]);
    const { results } = await repo.find(2, '');
    expect(data.length).toEqual(3);
    expect(results.length).toEqual(2);
  });
});
