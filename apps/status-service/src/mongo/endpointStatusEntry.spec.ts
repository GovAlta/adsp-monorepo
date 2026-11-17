import { connect, connection, model } from 'mongoose';
import { Logger } from 'winston';
import MongoEndpointStatusEntryRepository from './endpointStatusEntry';
import { EndpointStatusEntryEntity } from '../app/model/endpointStatusEntry';

describe('Endpoint status entry mongo repository', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const tenantA = 'urn:ads:platform:tenant-service:v2:/tenants/a';
  const tenantB = 'urn:ads:platform:tenant-service:v2:/tenants/b';

  let repo: MongoEndpointStatusEntryRepository;

  beforeEach(async () => {
    await connect(process.env.MONGO_URL);
    repo = new MongoEndpointStatusEntryRepository(logger);
    await model('EndpointStatusEntry').deleteMany({});
  });

  afterEach(async () => {
    await connection.close();
  });

  const save = (tenantId: string, timestamp: number) =>
    repo.save(
      new EndpointStatusEntryEntity(repo, {
        ok: true,
        url: 'https://portal.example',
        status: '200',
        timestamp,
        responseTime: 10,
        applicationId: 'portal',
        tenantId,
      }),
    );

  it('findRecent returns only entries for the given tenant', async () => {
    await save(tenantA, Date.now());
    await save(tenantB, Date.now());

    const entries = await repo.findRecent(tenantA);

    expect(entries).toHaveLength(1);
    expect(entries[0].tenantId).toBe(tenantA);
  });

  it('findRecent excludes entries older than the age window', async () => {
    await save(tenantA, Date.now() - 60 * 60_000);
    await save(tenantA, Date.now());

    const entries = await repo.findRecent(tenantA, 30);

    expect(entries).toHaveLength(1);
  });
});
