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

  function insertMockData(notices: Partial<NoticeApplicationEntity>[]): Promise<NoticeApplicationEntity[]> {
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
        message: 'Test',
        tennantServRef: '[{"id":"6148f920213a6f00121531b4","name":"mock-application"}]',
        startDate: new Date('2021-09-27T16:00:00.000Z'),
        endDate: new Date('2021-09-27T20:00:00.000Z'),
        isAllApplications: true,
      },
    ]);

    const results = await repo.find(10, 0, {});
    expect(results.results[0].message).toEqual('Test');
    expect(results.results[0].isAllApplications).toEqual(true);
    const isDelete = await repo.delete(results.results[0]);
    expect(isDelete).toEqual(true);
  });

  it('Create and find different notice modes', async () => {
    await insertMockData([
      {
        message: 'Test',
        tennantServRef: '[{"id":"6148f920213a6f00121531b4","name":"mock-application"}]',
        startDate: new Date('2021-09-27T16:00:00.000Z'),
        endDate: new Date('2021-09-27T20:00:00.000Z'),
        isAllApplications: true,
        mode: 'draft',
      },
    ]);
    await insertMockData([
      {
        message: 'Published',
        tennantServRef: '[{"id":"6148f920213a6f00121531b4","name":"mock-application"}]',
        startDate: new Date('2021-09-27T16:00:00.000Z'),
        endDate: new Date('2021-09-27T20:00:00.000Z'),
        isAllApplications: true,
        mode: 'published',
      },
    ]);
    await insertMockData([
      {
        message: 'Published',
        tennantServRef: '[{"id":"6148f920213a6f00121531b4","name":"mock-application"}]',
        startDate: new Date('2021-09-27T16:00:00.000Z'),
        endDate: new Date('2021-09-27T20:00:00.000Z'),
        isAllApplications: true,
        mode: 'archived',
      },
    ]);

    const active = await repo.find(10, 0, { mode: 'active' });
    expect(active.results.length).toEqual(2);
    const published = await repo.find(10, 0, { mode: 'published' });
    expect(published.results.length).toEqual(1);
    const draft = await repo.find(10, 0, { mode: 'draft' });
    expect(draft.results.length).toEqual(1);
    const archived = await repo.find(10, 0, { mode: 'archived' });
    expect(archived.results.length).toEqual(1);
  });
});
