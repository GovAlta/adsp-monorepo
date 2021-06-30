import { ServiceStatusType, ServiceStatusApplicationEntity } from '..';
import { createMockMongoServer, disconnectMockMongo } from '../../mongo/mock';
import MongoServiceStatusRepository from '../../mongo/serviceStatus';
import MongoEndpointStatusEntryRepository from '../../mongo/endpointStatusEntry';
import { createCheckEndpointJob } from '../jobs/checkEndpoint';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';

describe('Validate endpoint checking', () => {
  let serviceStatusRepository: MongoServiceStatusRepository;
  let endpointStatusEntryRepository: MongoEndpointStatusEntryRepository;
  let mongoose: typeof import('mongoose');

  beforeEach(async (done) => {
    mongoose = await createMockMongoServer();
    serviceStatusRepository = new MongoServiceStatusRepository();
    endpointStatusEntryRepository = new MongoEndpointStatusEntryRepository();
    done();
  });

  afterEach(async (done) => {
    await disconnectMockMongo();
    done();
  });

  function generateId(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }

  async function createMockApplication(initStatus: ServiceStatusType): Promise<ServiceStatusApplicationEntity> {
    const appData: Partial<ServiceStatusApplicationEntity> = {
      _id: generateId(),
      endpoints: [{ url: 'http://foo.bar', status: initStatus === 'operational' ? 'online' : 'offline' }],
      name: 'app 1',
      status: initStatus,
      tenantId: '99',
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

  it('should mock api request', async () => {
    const application = await createMockApplication('operational');
    const url = application.endpoints[0].url;

    await checkServiceStatus(application, { status: 200 });

    const entries = await endpointStatusEntryRepository.findRecentByUrl(url);
    expect(entries.length).toEqual(1);
    expect(entries[0].ok).toEqual(true);
  });

  it('should update the service state to `operational` after 3 successful requests', async () => {
    const application = await createMockApplication('reported-issues');
    const url = application.endpoints[0].url;

    let service: ServiceStatusApplicationEntity;
    let entries: EndpointStatusEntryEntity[];

    // init state check
    service = (await serviceStatusRepository.find({ _id: application._id }))[0];
    expect(service.status).toBe('reported-issues');

    // pass 1 - should be `reported-issues`
    {
      await checkServiceStatus(application, { status: 200 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(1);
      expect(entries[0].ok).toBe(true);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('offline');
    }

    // pass 2 - should still be `reported-issues`
    {
      await checkServiceStatus(application, { status: 200 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(2);
      expect(entries[0].ok).toBe(true);
      expect(entries[1].ok).toBe(true);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('offline');
    }

    // pass 3 - should now be `operational`
    {
      await checkServiceStatus(application, { status: 200 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(3);
      expect(entries[0].ok).toBe(true);
      expect(entries[1].ok).toBe(true);
      expect(entries[2].ok).toBe(true);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('operational');
      expect(service.endpoints[0].status).toBe('online');
    }
  });

  it('should update the service state to `reported-issues` after 3 failed requests', async () => {
    const application = await createMockApplication('operational');
    const url = application.endpoints[0].url;

    let service: ServiceStatusApplicationEntity;
    let entries: EndpointStatusEntryEntity[];

    // init state check
    service = (await serviceStatusRepository.find({ _id: application._id }))[0];
    expect(service.status).toBe('operational');

    // pass 1 - should be `operational`
    {
      await checkServiceStatus(application, { status: 500 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(1);
      expect(entries[0].ok).toBe(false);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('operational');
      expect(service.endpoints[0].status).toBe('online');
    }

    // pass 2 - should still be `operational`
    {
      await checkServiceStatus(application, { status: 500 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(2);
      expect(entries[0].ok).toBe(false);
      expect(entries[1].ok).toBe(false);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('operational');
      expect(service.endpoints[0].status).toBe('online');
    }

    // pass 3 - should now be `reported-issues`
    {
      await checkServiceStatus(application, { status: 500 });

      entries = await endpointStatusEntryRepository.findRecentByUrl(url);
      expect(entries.length).toEqual(3);
      expect(entries[0].ok).toBe(false);
      expect(entries[1].ok).toBe(false);
      expect(entries[2].ok).toBe(false);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('offline');
    }
  });

  it('should go up, then back down', async () => {
    const application = await createMockApplication('operational');

    // init state check
    {
      await checkServiceStatus(application, { status: 500 });
      await checkServiceStatus(application, { status: 500 });
      await checkServiceStatus(application, { status: 500 });

      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('offline');
    }

    // now up
    {
      await checkServiceStatus(application, { status: 200 });
      await checkServiceStatus(application, { status: 200 });
      await checkServiceStatus(application, { status: 200 });
      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('operational');
      expect(service.endpoints[0].status).toBe('online');
    }

    // still up
    {
      await checkServiceStatus(application, { status: 500 });

      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('operational');
      expect(service.endpoints[0].status).toBe('online');
    }

    // back down
    {
      await checkServiceStatus(application, { status: 500 });
      await checkServiceStatus(application, { status: 500 });

      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('offline');
    }
  });

  it('should not update the application state if manualOverride is on', async () => {
    let application = await createMockApplication('operational');

    // enable manual override
    application.manualOverride = 'on';
    application = await serviceStatusRepository.save(application);

    {
      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('operational');
    }

    // init state check, due to manualOverride, should still be operational
    {
      await checkServiceStatus(application, { status: 500 });
      await checkServiceStatus(application, { status: 500 });
      await checkServiceStatus(application, { status: 500 });

      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('operational');
      expect(service.endpoints[0].status).toBe('offline');
    }

    // disable manual override
    application.manualOverride = 'off';
    application = await serviceStatusRepository.save(application);

    // should now get set to `off`
    {
      await checkServiceStatus(application, { status: 500 });

      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.status).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('offline');
    }
  });
});
