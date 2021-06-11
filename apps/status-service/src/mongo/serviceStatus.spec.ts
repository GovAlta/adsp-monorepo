// This import adds type definitions for req.User
import '@abgov/adsp-service-sdk';
import { createMockMongoServer, disconnectMockMongo } from './mock';
import { MongoServiceStatusRepository } from './serviceStatus';
import { ServiceStatusApplicationEntity } from '../app';

const defaultTimeout = 20000;

describe('Service status mongo repository', () => {
  let repo: MongoServiceStatusRepository;
  let mongoose: typeof import('mongoose');

  beforeEach(async () => {
    jest.setTimeout(defaultTimeout);
    mongoose = await createMockMongoServer();
    repo = new MongoServiceStatusRepository();
  });

  function insertMockData(
    applications: Partial<ServiceStatusApplicationEntity>[]
  ): Promise<ServiceStatusApplicationEntity[]> {
    return Promise.all(
      applications.map(async (entity: ServiceStatusApplicationEntity) => {
        entity.id = generateId();
        return await repo.save(entity);
      })
    );
  }

  function generateId(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }

  afterEach(async () => {
    await disconnectMockMongo();
  });

  it('should contain the mock data', async (done) => {
    const applications = await insertMockData([
      { name: 'app 1', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 2', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 3', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '99' },
    ]);
    const apps = await repo.find({});
    expect(apps.length).toEqual(applications.length);
    done();
  });

  it('find the queued disabled applications', async (done) => {
    const applications = await insertMockData([
      { name: 'app 1', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 2', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 3', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '99' },
    ]);
    const queuedIds = applications.map((app) => app.id);
    const actual = await repo.findQueuedDisabledApplications(queuedIds);
    expect(actual.length).toEqual(2);
    done();
  });

  it('finds the enabled applications that are not yet on the process queue', async (done) => {
    const applications = await insertMockData([
      { name: 'app 1', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 2', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '99' }, // non-queued
      { name: 'app 3', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' }, // not enabled so shouldn't be queued
      { name: 'app 4', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '33' },
    ]);
    const queuedApps = ['app 1', 'app 4'];
    const queuedIds = applications.filter((app) => queuedApps.includes(app.name)).map((app) => app.id);
    const actual = await repo.findNonQueuedApplications(queuedIds);
    expect(actual.length).toEqual(1);
    done();
  });

  it('finds the applications that exist in the process queue, but have been deleted in the db', async (done) => {
    const applications = await insertMockData([
      { name: 'app 1', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 2', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '99' }, // non-queued
      { name: 'app 3', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' }, // not enabled so shouldn't be queued
      { name: 'app 4', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '33' },
    ]);
    const queuedApps = ['app 1', 'app 4'];
    const queuedIds = applications.filter((app) => queuedApps.includes(app.name)).map((app) => app.id);
    queuedIds.push(generateId(), generateId());
    const actual = await repo.findQueuedDeletedApplicationIds(queuedIds);
    expect(actual.length).toEqual(2);
    done();
  });

  it('enables an application', async (done) => {
    const applications = await insertMockData([
      { name: 'app 1', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 2', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
    ]);
    await repo.enable(applications[0]);

    const enabledApplications = await repo.findEnabledApplications();
    expect(enabledApplications.length).toEqual(1);
    done();
  });

  it("disables an application and all it's endpoints", async (done) => {
    const applications = await insertMockData([
      {
        name: 'app 1',
        endpoints: [
          { status: 'online', url: 'foo.com' },
          { status: 'offline', url: 'bar.com' },
        ],
        status: 'operational',
        timeIntervalMin: 2,
        tenantId: '99',
      },
      { name: 'app 2', endpoints: [], status: 'operational', timeIntervalMin: 2, tenantId: '99' },
    ]);
    await repo.disable(applications[0]);

    const disabledApplications = await repo.find({ status: 'disabled' });
    expect(disabledApplications.length).toEqual(1);
    expect(disabledApplications[0].endpoints[0].status).toEqual('disabled');
    expect(disabledApplications[0].endpoints[1].status).toEqual('disabled');
    done();
  });

  it('deletes the application', async (done) => {
    const applications = await insertMockData([
      { name: 'app 1', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 2', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
    ]);
    await repo.delete(applications[0]);
    const apps = await repo.find({});
    expect(apps.length).toEqual(1);
    done();
  });

  it('gets an application by id', async (done) => {
    const applications = await insertMockData([
      { name: 'app 1', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 2', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
    ]);
    const app = await repo.get(applications[0].id);
    expect(app).not.toBeNull();
    expect(app.name).toEqual(applications[0].name);
    done();
  });

  it('saves the existing app', async (done) => {
    const applications = await insertMockData([
      { name: 'app 1', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
      { name: 'app 2', endpoints: [], status: 'disabled', timeIntervalMin: 2, tenantId: '99' },
    ]);
    const editedApp = applications[0];
    editedApp.name = 'edited app';
    await repo.save(editedApp);

    const appCheck = await repo.get(editedApp.id);

    expect(appCheck).not.toBeNull();
    expect(appCheck.name).toEqual(editedApp.name);
    done();
  });
});
