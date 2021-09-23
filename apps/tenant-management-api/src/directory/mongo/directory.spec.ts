import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { DirectoryEntity } from '../model';
import { MongoDirectoryRepository } from './directory';

describe('Mongo: Directory', () => {
  const repo = new MongoDirectoryRepository();

  beforeEach(async () => {
    await connect();
  });

  afterEach(async () => {
    await disconnect();
  });

  it('should create an option', async () => {
    const data = await createMockData<DirectoryEntity>(repo, [{}]);
    const { results } = await repo.find(99, null, null);
    expect(results.length).toEqual(data.length);
  });
});
