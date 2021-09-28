// This import adds type definitions for req.User
import '@abgov/adsp-service-sdk';
import { connect, connection, model } from 'mongoose';
import { MongoNoticeRepository } from './notice';
import { NoticeApplicationEntity } from '../app';

describe('Service status mongo repository', () => {
  let repo: MongoNoticeRepository;
  let mongoose: typeof import('mongoose');

  beforeEach(async () => {
    mongoose = await connect(process.env.MONGO_URL);
    repo = new MongoNoticeRepository();
    await model('Notice').deleteMany({});
  });

  afterEach(async () => {
    await connection.close();
  });

  function insertMockData(
    notices: Partial<NoticeApplicationEntity>[]
  ): Promise<NoticeApplicationEntity[]> {
    return Promise.all(
      notices.map(async (entity: NoticeApplicationEntity) => {
        entity.id = generateId();
        return await repo.save(entity);
      })
    );
  }

  function generateId(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }

  it('Create and find notices', async () => {
    await insertMockData([
      {
        message: "Test",
        tennantServRef: "[{\"id\":\"6148f920213a6f00121531b4\",\"name\":\"mock-application\"}]",
        startDate: new Date("2021-09-27T16:00:00.000Z"),
        endDate: new Date("2021-09-27T20:00:00.000Z"),
        isCrossTenants: true
      }
    ]);

    const results = await repo.find(10, 0, {})
    expect(results.results[0].message).toEqual('Test');
    expect(results.results[0].isCrossTenants).toEqual(true);
    const isDelete = await repo.delete(results.results[0]);
    expect(isDelete).toEqual(true);
  });
});
