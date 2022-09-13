// This import adds type definitions for req.User
import '@abgov/adsp-service-sdk';
import { connect, connection, model } from 'mongoose';
import { MongoServiceStatusRepository } from './serviceStatus';
import { ServiceStatusApplicationEntity } from '../app';

describe('Service status mongo repository', () => {
  let repo: MongoServiceStatusRepository;
  let mongoose: typeof import('mongoose');

  beforeEach(async () => {
    mongoose = await connect(process.env.MONGO_URL);
    repo = new MongoServiceStatusRepository();
    await model('ServiceStatus').deleteMany({});
  });

  afterEach(async () => {
    await connection.close();
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

  it('should contain the mock data', async () => {
    const applications = await insertMockData([
      { enabled: true, status: 'operational', tenantId: '99' },
      { enabled: true, status: 'operational', tenantId: '99' },
      { enabled: true, status: 'operational', tenantId: '99' },
    ]);
    const apps = await repo.find({});
    expect(apps.length).toEqual(applications.length);
  });

  it('enables an application', async () => {
    const applications = await insertMockData([
      {
        enabled: false,
        tenantId: '99',
        tenantName: 'Child Services',
        tenantRealm: '123123-123123-123123-123123',
        endpoint: {
          status: null,
          id: '12345',
          url: 'http://www.yahoo.com',
        },
      },
      {
        enabled: false,
        tenantId: '99',
        tenantName: 'Child Services',
        tenantRealm: '123123-123123-123123-123123',
        endpoint: {
          status: null,
          id: '12345',
          url: 'http://www.yahoo.com',
        },
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
        endpoint: { status: 'online', id: '12345', url: 'http://www.yahoo.com' },
        status: 'operational',
        tenantId: '99',
        tenantName: 'Child Services',
        tenantRealm: '123123-123123-123123-123123',
      },
      {
        status: 'operational',
        tenantId: '99',
        tenantName: 'Child Services',
        tenantRealm: '123123-123123-123123-123123',
      },
    ]);
    await repo.disable(applications[0]);

    const disabledApplications = await repo.find({ enabled: false });
    expect(disabledApplications.length).toEqual(1);
  });

  it('deletes the application', async () => {
    const applications = await insertMockData([
      { enabled: false, tenantId: '99' },
      { enabled: false, tenantId: '99' },
    ]);
    await repo.delete(applications[0]);
    const apps = await repo.find({});
    expect(apps.length).toEqual(1);
  });

  it('gets an application by id', async () => {
    const applications = await insertMockData([
      { enabled: false, tenantId: '20' },
      { enabled: false, tenantId: '21' },
    ]);
    const app = await repo.get(applications[0]._id);
    expect(app).not.toBeNull();
    expect(app.tenantId).toEqual(applications[0].tenantId);
  });

  it('saves the existing app', async () => {
    const applications = await insertMockData([
      { enabled: false, tenantId: '20' },
      { enabled: false, tenantId: '22' },
    ]);
    const editedApp = applications[0];
    await repo.save(editedApp);

    const appCheck = await repo.get(editedApp._id);

    expect(appCheck).not.toBeNull();
    expect(appCheck.tenantId).toEqual(editedApp.tenantId);
  });
});
