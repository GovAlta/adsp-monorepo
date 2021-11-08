import { MongoTenantConfigurationRepository } from './tenantConfig';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { TenantConfigEntity } from '../configuration';

describe('Mongo: TenantConfig', () => {
  const repo = new MongoTenantConfigurationRepository();

  beforeEach(async () => {
    await connect();
  });

  afterEach(async () => {
    await disconnect();
  });

  it('should create an option', async () => {
    const data = await createMockData<TenantConfigEntity>(repo, [{}]);
    const { results } = await repo.find(99, '');
    expect(results.length).toEqual(data.length);
  });

  it('finds a defined record count ', async () => {
    const data = await createMockData<TenantConfigEntity>(repo, [{ tenantName: '1' }, { tenantName: '2' }, { tenantName: '3' }]);
    const { results } = await repo.find(2, '');
    expect(data.length).toEqual(3);
    expect(results.length).toEqual(2);
  });
});
