import { InternalServiceStatusType, ServiceStatusApplicationEntity } from '..';
import { createMockMongoServer, disconnectMockMongo } from '../../mongo/mock';
import MongoServiceStatusRepository from '../../mongo/serviceStatus';
import MongoEndpointStatusEntryRepository from '../../mongo/endpointStatusEntry';
import { createCheckEndpointJob } from '../jobs/checkEndpoint';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';

const defaultTimeout = 20000;

describe('Validate endpoint checking', () => {
  let serviceStatusRepository: MongoServiceStatusRepository;
  let endpointStatusEntryRepository: MongoEndpointStatusEntryRepository;
  let mongoose: typeof import('mongoose');

  beforeEach(async (done) => {
    jest.setTimeout(defaultTimeout);
    mongoose = await createMockMongoServer();
    serviceStatusRepository = new MongoServiceStatusRepository();
    endpointStatusEntryRepository = new MongoEndpointStatusEntryRepository();
    done();
  });

  function generateId(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }

  async function createMockApplication(initStatus: InternalServiceStatusType): Promise<ServiceStatusApplicationEntity> {
    const appData: Partial<ServiceStatusApplicationEntity> = {
      _id: generateId(),
      endpoints: [{ url: 'http://foo.bar', status: initStatus === 'operational' ? 'up' : 'down' }],
      internalStatus: initStatus,
      name: 'app 1',
      publicStatus: 'enabled',
      tenantId: '99',
    };
    return await serviceStatusRepository.save(appData as ServiceStatusApplicationEntity);
  }

  afterEach(async (done) => {
    await disconnectMockMongo();
    done();
  });

  async function mockRequest(application: ServiceStatusApplicationEntity, res: { status: number }) {
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
    const url = application.endpoints[0].url;

    await mockRequest(application, { status: 200 });

    const entries = await endpointStatusEntryRepository.findByUrl(url);
    expect(entries.length).toEqual(1);
    expect(entries[0].ok).toEqual(true);

    done();
  });

  it('should update the service state to `operational` after 3 successful requests', async (done) => {
    const application = await createMockApplication('reported-issues');
    const url = application.endpoints[0].url;

    let service: ServiceStatusApplicationEntity;
    let entries: EndpointStatusEntryEntity[];

    // init state check
    service = (await serviceStatusRepository.find({ _id: application._id }))[0];
    expect(service.internalStatus).toBe('reported-issues');

    // pass 1 - should be `reported-issues`
    {
      await mockRequest(application, { status: 200 });

      entries = await endpointStatusEntryRepository.findByUrl(url);
      expect(entries.length).toEqual(1);
      expect(entries[0].ok).toBe(true);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('down');
    }

    // pass 2 - should still be `reported-issues`
    {
      await mockRequest(application, { status: 200 });

      entries = await endpointStatusEntryRepository.findByUrl(url);
      expect(entries.length).toEqual(2);
      expect(entries[0].ok).toBe(true);
      expect(entries[1].ok).toBe(true);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('down');
    }

    // pass 3 - should now be `operational`
    {
      await mockRequest(application, { status: 200 });

      entries = await endpointStatusEntryRepository.findByUrl(url);
      expect(entries.length).toEqual(3);
      expect(entries[0].ok).toBe(true);
      expect(entries[1].ok).toBe(true);
      expect(entries[2].ok).toBe(true);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('operational');
      expect(service.endpoints[0].status).toBe('up');
    }

    done();
  });

  it('should update the service state to `reported-issues` after 3 failed requests', async (done) => {
    const application = await createMockApplication('operational');
    const url = application.endpoints[0].url;

    let service: ServiceStatusApplicationEntity;
    let entries: EndpointStatusEntryEntity[];

    // init state check
    service = (await serviceStatusRepository.find({ _id: application._id }))[0];
    expect(service.internalStatus).toBe('operational');

    // pass 1 - should be `operational`
    {
      await mockRequest(application, { status: 500 });

      entries = await endpointStatusEntryRepository.findByUrl(url);
      expect(entries.length).toEqual(1);
      expect(entries[0].ok).toBe(false);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('operational');
      expect(service.endpoints[0].status).toBe('up');
    }

    // pass 2 - should still be `operational`
    {
      await mockRequest(application, { status: 500 });

      entries = await endpointStatusEntryRepository.findByUrl(url);
      expect(entries.length).toEqual(2);
      expect(entries[0].ok).toBe(false);
      expect(entries[1].ok).toBe(false);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('operational');
      expect(service.endpoints[0].status).toBe('up');
    }

    // pass 3 - should now be `reported-issues`
    {
      await mockRequest(application, { status: 500 });

      entries = await endpointStatusEntryRepository.findByUrl(url);
      expect(entries.length).toEqual(3);
      expect(entries[0].ok).toBe(false);
      expect(entries[1].ok).toBe(false);
      expect(entries[2].ok).toBe(false);

      service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('down');
    }

    done();
  });

  it('should go up, then back down', async (done) => {
    const application = await createMockApplication('operational');

    // init state check
    {
      await mockRequest(application, { status: 500 });
      await mockRequest(application, { status: 500 });
      await mockRequest(application, { status: 500 });
      await mockRequest(application, { status: 500 });

      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('down');
    }

    // now up
    {
      await mockRequest(application, { status: 200 });
      await mockRequest(application, { status: 200 });
      await mockRequest(application, { status: 200 });
      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('operational');
      expect(service.endpoints[0].status).toBe('up');
    }

    // still up
    {
      await mockRequest(application, { status: 500 });

      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('operational');
      expect(service.endpoints[0].status).toBe('up');
    }

    // back down
    {
      await mockRequest(application, { status: 500 });
      await mockRequest(application, { status: 500 });

      const service = (await serviceStatusRepository.find({ _id: application._id }))[0];
      expect(service.internalStatus).toBe('reported-issues');
      expect(service.endpoints[0].status).toBe('down');
    }

    done();
  });
});
