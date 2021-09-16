// This import adds type definitions for req.User
import '@abgov/adsp-service-sdk';
import { createMockMongoServer, disconnectMockMongo } from './mock';
import { MongoServiceStatusRepository } from './serviceStatus';
import { ServiceStatusApplicationEntity } from '../app';

describe('Service status mongo repository', () => {
  let repo: MongoServiceStatusRepository;
  let mongoose: typeof import('mongoose');

  beforeEach(async () => {
    mongoose = await createMockMongoServer();
    repo = new MongoServiceStatusRepository();
  });

  afterEach(async () => {
    await disconnectMockMongo();
  });

  function insertMockData(
    applications: Partial<ServiceStatusApplicationEntity>[]
  ): Promise<ServiceStatusApplicationEntity[]> {
    return Promise.all(
      applications.map(async (entity: ServiceStatusApplicationEntity) => {
        entity._id = generateId();
        return await repo.save(entity);
      })
    );
  }

  function generateId(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }

  async function generateDeletedIds(count: number): Promise<string[]> {
    const apps: Partial<ServiceStatusApplicationEntity>[] = [];
    for (let i = 0; i < count; i++) {
      apps.push({
        name: 'deleted app',
        status: 'operational',
        tenantId: '99',
      });
    }
    const createdApps = await insertMockData(apps);
    for (const createdApp of createdApps) {
      await repo.delete(createdApp);
    }

    return createdApps.map((a) => a._id);
  }

  it('should contain the mock data', async () => {
    const applications = await insertMockData([
      { name: 'app 1', enabled: true, status: 'operational', tenantId: '99' },
      { name: 'app 2', enabled: true, status: 'operational', tenantId: '99' },
      { name: 'app 3', enabled: true, status: 'operational', tenantId: '99' },
    ]);
    const apps = await repo.find({});
    expect(apps.length).toEqual(applications.length);
  });

  it('find the queued disabled applications', async () => {
    const applications = await insertMockData([
      { name: 'app 1', enabled: false, tenantId: '99' },
      { name: 'app 2', enabled: false, tenantId: '99' },
      { name: 'app 3', enabled: true, status: 'operational', tenantId: '99' },
    ]);
    const queuedIds = applications.map((app) => app._id);
    const actual = await repo.findQueuedDisabledApplications(queuedIds);
    expect(actual.length).toEqual(2);
  });

  it('finds the enabled applications that are not yet on the process queue', async () => {
    const applications = await insertMockData([
      { name: 'app 1', enabled: true, tenantId: '99' },
      { name: 'app 2', enabled: true, tenantId: '99' }, // non-queued
      { name: 'app 3', enabled: false, tenantId: '99' }, // not enabled so shouldn't be queued
      { name: 'app 4', enabled: true, tenantId: '33' },
    ]);
    const queuedApps = ['app 1', 'app 4'];
    const queuedIds = applications.filter((app) => queuedApps.includes(app.name)).map((app) => app._id);
    const actual = await repo.findNonQueuedApplications(queuedIds);
    expect(actual.length).toEqual(1);
  });

  it('finds the applications that exist in the process queue, but have been deleted in the db', async () => {
    const applications = await insertMockData([
      { name: 'app 1', enabled: true, tenantId: '99' },
      { name: 'app 2', enabled: true, tenantId: '99' }, // non-queued
      { name: 'app 3', enabled: false, tenantId: '99' }, // not enabled so shouldn't be queued
      { name: 'app 4', enabled: true, tenantId: '33' },
    ]);
    const queuedApps = ['app 1', 'app 4'];
    const queuedIds = applications.filter((app) => queuedApps.includes(app.name)).map((app) => app._id);

    // simulate additional ids in the queue that don't exist in the db i.e. have been deleted
    const deletedIds = await generateDeletedIds(2);
    queuedIds.push(...deletedIds);

    const actual = await repo.findQueuedDeletedApplicationIds(queuedIds);
    expect(actual.length).toEqual(2);
  });

  it('enables an application', async () => {
    const applications = await insertMockData([
      {
        name: 'app 1',
        enabled: false,
        tenantId: '99',
        tenantName: 'Child Services',
        tenantRealm: '123123-123123-123123-123123',
      },
      {
        name: 'app 2',
        enabled: false,
        tenantId: '99',
        tenantName: 'Child Services',
        tenantRealm: '123123-123123-123123-123123',
      },
    ]);
    await repo.enable(applications[0]);

    const allApplications = await repo.find({});
    expect(allApplications.length).toBe(2);
    const enabledApplications = await repo.findEnabledApplications();
    expect(enabledApplications.length).toEqual(1);
  });

  it("disables an application and all it's endpoints", async () => {
    const applications = await insertMockData([
      {
        name: 'app 1',
        endpoint: { status: 'online', url: 'foo.com' },
        status: 'operational',
        tenantId: '99',
        tenantName: 'Child Services',
        tenantRealm: '123123-123123-123123-123123',
      },
      {
        name: 'app 2',
        status: 'operational',
        tenantId: '99',
        tenantName: 'Child Services',
        tenantRealm: '123123-123123-123123-123123',
      },
    ]);
    await repo.disable(applications[0]);

    const disabledApplications = await repo.find({ enabled: false });
    expect(disabledApplications.length).toEqual(1);
    expect(disabledApplications[0].endpoint.status).toEqual('disabled');
  });

  it('deletes the application', async () => {
    const applications = await insertMockData([
      { name: 'app 1', enabled: false, tenantId: '99' },
      { name: 'app 2', enabled: false, tenantId: '99' },
    ]);
    await repo.delete(applications[0]);
    const apps = await repo.find({});
    expect(apps.length).toEqual(1);
  });

  it('gets an application by id', async () => {
    const applications = await insertMockData([
      { name: 'app 1', enabled: false, tenantId: '99' },
      { name: 'app 2', enabled: false, tenantId: '99' },
    ]);
    const app = await repo.get(applications[0]._id);
    expect(app).not.toBeNull();
    expect(app.name).toEqual(applications[0].name);
  });

  it('saves the existing app', async () => {
    const applications = await insertMockData([
      { name: 'app 1', enabled: false, tenantId: '99' },
      { name: 'app 2', enabled: false, tenantId: '99' },
    ]);
    const editedApp = applications[0];
    editedApp.name = 'edited app';
    await repo.save(editedApp);

    const appCheck = await repo.get(editedApp._id);

    expect(appCheck).not.toBeNull();
    expect(appCheck.name).toEqual(editedApp.name);
  });
});
