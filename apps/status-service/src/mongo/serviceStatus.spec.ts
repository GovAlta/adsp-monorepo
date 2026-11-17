// This import adds type definitions for req.User
import '@abgov/adsp-service-sdk';
import { connect, connection, model } from 'mongoose';
import { Logger } from 'winston';
import { MongoServiceStatusRepository } from './serviceStatus';
import { ServiceStatusApplicationEntity } from '../app';

describe('Service status mongo repository', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  let repo: MongoServiceStatusRepository;
  let mongoose: typeof import('mongoose');

  beforeEach(async () => {
    mongoose = await connect(process.env.MONGO_URL);
    repo = new MongoServiceStatusRepository(logger);
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
      { enabled: true, status: 'operational' },
      { enabled: true, status: 'operational' },
      { enabled: true, status: 'operational' },
    ]);
    const apps = await repo.find({});
    expect(apps.length).toEqual(applications.length);
  });

  it('enables an application', async () => {
    const applications = await insertMockData([
      {
        enabled: false,
        appKey: 'test-mock-app-0',
        tenantId: 'MockTenant',
        endpoint: {
          status: null,
        },
      },
      {
        enabled: false,
        appKey: 'test-mock-app-0',
        tenantId: 'MockTenant',
        endpoint: {
          status: null,
        },
      },
    ]);
    await repo.enable(applications[0]);

    const allApplications = await repo.find({});
    expect(allApplications.length).toBe(2);
    const enabledApplications = await repo.findEnabledApplications('MockTenant');
    expect(enabledApplications.length).toEqual(1);
  });

  it("disables an application and all it's endpoints", async () => {
    const applications = await insertMockData([
      {
        endpoint: { status: 'online' },
        status: 'operational',
        appKey: 'mock-test-app-0',
      },
      {
        status: 'operational',
        appKey: 'mock-test-app-1',
      },
    ]);
    await repo.disable(applications[0]);

    const disabledApplications = await repo.find({ enabled: false });
    expect(disabledApplications.length).toEqual(1);
  });

  it('deletes the application', async () => {
    const applications = await insertMockData([{ enabled: false }, { enabled: false }]);
    await repo.delete(applications[0]);
    const apps = await repo.find({});
    expect(apps.length).toEqual(1);
  });

  it('gets an application by id', async () => {
    const applications = await insertMockData([{ enabled: false }, { enabled: false }]);
    const status = await repo.get(applications[0].appKey);
    expect(status).not.toBeNull();
    expect(status.enabled).toEqual(applications[0].enabled);
  });

  it('saves the existing app', async () => {
    const apps = await insertMockData([
      { enabled: false, appKey: 'app-0' },
      { enabled: false, appKey: 'app-1' },
    ]);
    const editedApp = apps[0];
    await repo.save(editedApp);

    const status = await repo.get(editedApp.appKey);

    expect(status).not.toBeNull();
    expect(status.appKey).toEqual(editedApp.appKey);
  });

  describe('two tenants with the same appKey', () => {
    const tenantA = 'urn:ads:platform:tenant-service:v2:/tenants/a';
    const tenantB = 'urn:ads:platform:tenant-service:v2:/tenants/b';

    beforeEach(async () => {
      await insertMockData([
        { appKey: 'portal', tenantId: tenantA, status: 'operational', enabled: true, endpoint: { status: 'online' } },
        { appKey: 'portal', tenantId: tenantB, status: 'outage', enabled: false, endpoint: { status: 'offline' } },
      ]);
    });

    it('find returns only the status for the given tenant', async () => {
      const statuses = await repo.find({ appKey: 'portal', tenantId: tenantB });
      expect(statuses).toHaveLength(1);
      expect(statuses[0].tenantId).toBe(tenantB);
      expect(statuses[0].status).toBe('outage');
    });

    it('getByAppKey returns the status for the given tenant', async () => {
      const statusA = await repo.getByAppKey('portal', tenantA);
      const statusB = await repo.getByAppKey('portal', tenantB);
      expect(statusA.status).toBe('operational');
      expect(statusB.status).toBe('outage');
    });

    it('getByAppKey returns null for a tenant without the app', async () => {
      const status = await repo.getByAppKey('portal', 'urn:ads:platform:tenant-service:v2:/tenants/c');
      expect(status).toBeNull();
    });
  });
});
