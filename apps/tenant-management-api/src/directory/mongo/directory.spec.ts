import { connect, disconnect, createMockData } from '@core-services/core-common';
import { DirectoryEntity } from '../model';
import { MongoDirectoryRepository } from './directory';

describe('Mongo: Directory', () => {
  const repo = new MongoDirectoryRepository();

  beforeEach(async (done) => {
    await connect();
    done();
  });

  afterEach(async (done) => {
    await disconnect();
    done();
  });

  it('should create an option', async () => {
    const data = await createMockData<DirectoryEntity>(repo, [{}]);
    const { results } = await repo.find(99, null, null);
    expect(results.length).toEqual(data.length);
  });
});
