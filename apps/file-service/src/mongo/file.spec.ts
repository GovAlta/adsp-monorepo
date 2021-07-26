import { MongoFileRepository } from './file';
import { MongoFileSpaceRepository } from './space';
import * as NodeCache from 'node-cache';
import { connect, disconnect, createMockData } from '@core-services/core-common';
import { logger } from '@core-common/src/logger';
import { FileEntity } from '../file/model';
import { adspId, User } from '@abgov/adsp-service-sdk';
import { FileCriteria } from '../file/types';

describe('Mongo: FileEntity', async () => {
  const cache = new NodeCache({ stdTTL: 86400, useClones: false });
  const fileRepo = new MongoFileSpaceRepository(logger, cache);
  const repo = new MongoFileRepository(fileRepo);
  const spaceId = await fileRepo.getIdByTenant({
    name: 'Bob',
    id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    realm: '12323123',
  });
  if (!spaceId) {
    throw new NotFoundError(`Space Not Found`, spaceId);
  }
  const criteria: FileCriteria = {
    spaceEquals: spaceId,
    deleted: false,
  };

  beforeEach(async (done) => {
    await connect();
    done();
  });

  afterEach(async (done) => {
    await disconnect();
    done();
  });

  it('should create an option', async () => {
    const data = await createMockData<FileEntity>(repo, [{ id: 1 }]);
    const { results } = await repo.find(99, '');
    expect(results.length).toEqual(data.length);
  });

  it('finds a defined record count ', async () => {
    const data = await createMockData<FileEntity>(repo, [{}, {}, {}]);
    const { results } = await repo.find(2, '');
    expect(data.length).toEqual(3);
    expect(results.length).toEqual(2);
  });
});
