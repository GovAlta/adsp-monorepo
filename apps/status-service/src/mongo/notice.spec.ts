// This import adds type definitions for req.User
import '@abgov/adsp-service-sdk';
import { connect, connection, model } from 'mongoose';
import { Logger } from 'winston';
import { MongoNoticeRepository } from './notice';
import { NoticeApplicationEntity } from '../app';

describe('Service status mongo repository', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  let repo: MongoNoticeRepository;
  let mongoose: typeof import('mongoose');

  beforeEach(async () => {
    mongoose = await connect(process.env.MONGO_URL);
    repo = new MongoNoticeRepository(logger);
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
      }),
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

  it('scopes get and find to the tenant and pages results', async () => {
    const base = {
      message: 'Tenant',
      tennantServRef: '[]',
      startDate: new Date('2021-09-27T16:00:00.000Z'),
      endDate: new Date('2021-09-27T20:00:00.000Z'),
      isAllApplications: true,
    };
    const [a] = await insertMockData([{ ...base, tenantId: 'tenant-a' }]);
    await insertMockData([
      { ...base, tenantId: 'tenant-a' },
      { ...base, tenantId: 'tenant-b' },
    ]);

    expect(String((await repo.get(a.id, 'tenant-a')).id)).toEqual(String(a.id));
    expect(await repo.get(a.id, 'tenant-b')).toBeNull();
    expect(await repo.get(generateId(), 'tenant-a')).toBeNull();

    const page = await repo.find(1, 0, { tenantId: 'tenant-a' });
    expect(page.results.length).toEqual(1);
    expect(page.page.total).toEqual(2);
    expect(page.page.next).toEqual('after=1&top=1');
  });
});
