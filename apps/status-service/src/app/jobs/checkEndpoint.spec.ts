import { ServiceStatusApplicationEntity, PublicServiceStatusType } from '..';
import { createMockMongoServer, disconnectMockMongo } from '../../mongo/mock';
import MongoServiceStatusRepository from '../../mongo/serviceStatus';
import MongoEndpointStatusEntryRepository from '../../mongo/endpointStatusEntry';
import { createCheckEndpointJob } from '../jobs/checkEndpoint';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { User } from '@abgov/adsp-service-sdk';

describe.skip('Validate endpoint checking', () => {
  let serviceStatusRepository: MongoServiceStatusRepository;
  let endpointStatusEntryRepository: MongoEndpointStatusEntryRepository;
  let mongoose: typeof import('mongoose');

  const user: User = {
    id: '',
    name: '',
    email: '',
    roles: [],
    isCore: false,
    token: null,
  };

  beforeEach(async () => {
    mongoose = await createMockMongoServer();
    serviceStatusRepository = new MongoServiceStatusRepository();
    endpointStatusEntryRepository = new MongoEndpointStatusEntryRepository({
      everyMilliseconds: 1,
      limit: 1000,
    });
  });

  afterEach(async () => {
    await disconnectMockMongo();
  });

  function generateId(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }

  async function createMockApplication(initStatus: PublicServiceStatusType): Promise<ServiceStatusApplicationEntity> {
    const appData: Partial<ServiceStatusApplicationEntity> = {
      _id: generateId(),
      endpoint: { url: 'http://foo.bar', status: initStatus === 'operational' ? 'online' : 'offline' },
      name: 'app 1',
      status: initStatus,
      internalStatus: initStatus === 'operational' ? 'healthy' : 'unhealthy',
      tenantId: '99',
      enabled: true,
    };
    return await serviceStatusRepository.save(appData as ServiceStatusApplicationEntity);
  }

  async function checkServiceStatus(application: ServiceStatusApplicationEntity, res: { status: number }) {
    const job = createCheckEndpointJob({
      application,
      serviceStatusRepository,
      endpointStatusEntryRepository,
      getter: (_url: string) => {
        if (res.status > 400) {
          return Promise.reject({
            status: res.status,
          });
        }
        return Promise.resolve({
          status: res.status,
        });
      },
    });

    await job();
  }

  it('should mock api request', async (done) => {
    const application = await createMockApplication('operational');
    const url = application.endpoint.url;

    await checkServiceStatus(application, { status: 200 });

    const entries = await endpointStatusEntryRepository.findRecentByUrl(url);
    expect(entries.length).toEqual(1);
    expect(entries[0].ok).toEqual(true);
    done();
  });

  it('should update the internal service state to `operational` after 3 successful requests', async () => {
    const application = await createMockApplication('reported-issues');
    const url = application.endpoint.url;

    let service: ServiceStatusApplicationEntity;
    let entries: EndpointStatusEntryEntity[];

    // init state check
    service = await serviceStatusRepository.get(application._id);
    expect(service.internalStatus).toBe('unhealthy');

    // pass 1 - should be `unhealthy`
    {
      await checkServiceStatus(application, { status: 200 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(1);
      expect(entries[0].ok).toBe(true);

      service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('unhealthy');
      expect(service.endpoint.status).toBe('offline');
    }

    // pass 2 - should still be `unhealthy`
    {
      await checkServiceStatus(application, { status: 200 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(2);
      expect(entries[0].ok).toBe(true);
      expect(entries[1].ok).toBe(true);

      service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('unhealthy');
      expect(service.endpoint.status).toBe('offline');
    }

    // pass 3 - should now be `healthy`
    {
      await checkServiceStatus(application, { status: 200 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(3);
      expect(entries[0].ok).toBe(true);
      expect(entries[1].ok).toBe(true);
      expect(entries[2].ok).toBe(true);

      service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('healthy');
      expect(service.endpoint.status).toBe('online');
    }
  });

  it('should update the service state to `reported-issues` after 3 failed requests', async () => {
    const application = await createMockApplication('operational');
    const url = application.endpoint.url;

    let service: ServiceStatusApplicationEntity;
    let entries: EndpointStatusEntryEntity[];

    // init state check
    service = await serviceStatusRepository.get(application._id);
    expect(service.internalStatus).toBe('healthy');

    // pass 1 - should be `operational`
    {
      await checkServiceStatus(application, { status: 500 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(1);
      expect(entries[0].ok).toBe(false);

      service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('healthy');
      expect(service.endpoint.status).toBe('online');
    }

    // pass 2 - should still be `operational`
    {
      await checkServiceStatus(application, { status: 500 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(2);
      expect(entries[0].ok).toBe(false);
      expect(entries[1].ok).toBe(false);

      service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('healthy');
      expect(service.endpoint.status).toBe('online');
    }

    // pass 3 - should now be `reported-issues`
    {
      await checkServiceStatus(application, { status: 500 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(3);
      expect(entries[0].ok).toBe(false);
      expect(entries[1].ok).toBe(false);
      expect(entries[2].ok).toBe(false);

      service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('unhealthy');
      expect(service.endpoint.status).toBe('offline');
    }
  });

  it('should go up, then back down', async () => {
    const application = await createMockApplication('operational');

    // init state check
    {
      await checkServiceStatus(application, { status: 500 });
      await checkServiceStatus(application, { status: 500 });
      await checkServiceStatus(application, { status: 500 });

      const service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('unhealthy');
      expect(service.endpoint.status).toBe('offline');
    }

    // now up
    {
      await checkServiceStatus(application, { status: 200 });
      await checkServiceStatus(application, { status: 200 });
      await checkServiceStatus(application, { status: 200 });
      const service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('healthy');
      expect(service.endpoint.status).toBe('online');
    }

    // still up
    {
      await checkServiceStatus(application, { status: 500 });

      const service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('healthy');
      expect(service.endpoint.status).toBe('online');
    }

    // back down
    {
      await checkServiceStatus(application, { status: 500 });
      await checkServiceStatus(application, { status: 500 });

      const service = await serviceStatusRepository.get(application._id);
      expect(service.internalStatus).toBe('unhealthy');
      expect(service.endpoint.status).toBe('offline');
    }
  });

  it('should set the statusTimestamp when the status is manually changed', async () => {
    let application = await createMockApplication('operational');

    application.status = 'maintenance';
    application.statusTimestamp = 0;
    application = await serviceStatusRepository.save(application);

    application.setStatus(user, 'operational');
    application = await serviceStatusRepository.get(application._id);

    expect(application.statusTimestamp).not.toBeNull();
    expect(application.statusTimestamp).toBeGreaterThan(0);
  });

  it('should not set the statusTimestamp when the internal status changes', async () => {
    let application = await createMockApplication('operational');

    // init
    application.status = 'maintenance';
    application.statusTimestamp = 0
    application = await serviceStatusRepository.save(application);

    // status checks
    await checkServiceStatus(application, { status: 200 });
    await checkServiceStatus(application, { status: 200 });
    await checkServiceStatus(application, { status: 200 });

    application = await serviceStatusRepository.get(application._id);

    expect(application.statusTimestamp).toBe(0);
  });
});
