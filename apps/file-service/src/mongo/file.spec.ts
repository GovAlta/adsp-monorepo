import { MongoFileRepository } from './file';
import { FileSpaceRepository } from '../file';
import { connect, disconnect, createMockData } from '@core-services/core-common';
import { ServiceOptionEntity } from '../configuration';

describe('Mongo: ServiceOption', () => {
  const fileRepo = new FileSpaceRepository();
  const repo = new MongoFileRepository(fileRepo);

  beforeEach(async (done) => {
    await connect();
    done();
  });

  afterEach(async (done) => {
    await disconnect();
    done();
  });

  it('should create an option', async () => {
    const data = await createMockData<ServiceOptionEntity>(repo, [{ service: '' }]);
    const { results } = await repo.find(99, '');
    expect(results.length).toEqual(data.length);
  });

  it('finds a defined record count ', async () => {
    const data = await createMockData<ServiceOptionEntity>(repo, [{}, {}, {}]);
    const { results } = await repo.find(2, '');
    expect(data.length).toEqual(3);
    expect(results.length).toEqual(2);
  });
});

import { MongoFileRepository } from './file';
