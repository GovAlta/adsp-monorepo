import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { Logger } from 'winston';
import { TenantEntity } from '../tenant';
import { MongoTenantRepository } from './tenant';

describe('Mongo: Tenant', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const repo = new MongoTenantRepository(logger);

  beforeEach(async () => {
    await connect();
  });

  afterEach(async () => {
    await disconnect();
  });

  it('should create a tenant', async () => {
    const data = await createMockData<TenantEntity>(repo, [
      {
        adminEmail: 'ae',
        realm: 'r',
        name: 'n',
      },
    ]);
    const results = await repo.find();
    expect(results.length).toEqual(data.length);
  });
});
