import { createCheckEndpointJob, getNewEndpointStatus } from '../jobs/checkEndpoint';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusApplication } from '../types';
import { adspId } from '@abgov/adsp-service-sdk';

describe('checkEndpoint', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const statusRepositoryMock = {
    findEnabledApplications: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };

  const endpointRepositoryMock = {
    findRecentByUrlAndApplicationId: jest.fn(),
    deleteOldUrlStatus: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  describe('createCheckEndpointJob', () => {
    it('can create job', () => {
      const job = createCheckEndpointJob({
        url: 'https//test.co',
        applicationId: '123',
        getEndpointResponse: jest.fn(),
        logger: loggerMock,
        serviceStatusRepository: statusRepositoryMock,
        endpointStatusEntryRepository: endpointRepositoryMock,
        eventService: eventServiceMock,
      });

      expect(job).toBeTruthy();
    });

    describe('checkEndpointJob', () => {
      const getEndpointResponse = jest.fn();
      const job = createCheckEndpointJob({
        url: 'https//test.co',
        applicationId: '123',
        getEndpointResponse: jest.fn(),
        logger: loggerMock,
        serviceStatusRepository: statusRepositoryMock,
        endpointStatusEntryRepository: endpointRepositoryMock,
        eventService: eventServiceMock,
      });

      beforeEach(() => {
        eventServiceMock.send.mockReset();
        endpointRepositoryMock.save.mockReset();
        endpointRepositoryMock.findRecentByUrlAndApplicationId.mockReset();
        statusRepositoryMock.get.mockReset();
        statusRepositoryMock.save.mockReset();
      });

      it('can updated application healthy', async () => {
        getEndpointResponse.mockResolvedValueOnce({ status: 200 });
        endpointRepositoryMock.save.mockImplementationOnce((entity) => entity);
        endpointRepositoryMock.findRecentByUrlAndApplicationId.mockReturnValueOnce([
          {
            ok: true,
            url: 'https//test.co',
            status: 200,
            timestamp: new Date(),
            responseTime: 250,
          },
          {
            ok: true,
            url: 'https//test.co',
            status: 200,
            timestamp: new Date(),
            responseTime: 250,
          },
          {
            ok: true,
            url: 'https//test.co',
            status: 200,
            timestamp: new Date(),
            responseTime: 250,
          },
        ]);
        statusRepositoryMock.get.mockResolvedValueOnce(
          new ServiceStatusApplicationEntity(statusRepositoryMock, {
            tenantId: tenantId.toString(),
            _id: 'test-app',
            name: 'test-app',
            endpoint: { url: 'https://test.co', status: 'n/a' },
          } as ServiceStatusApplication)
        );
        statusRepositoryMock.save.mockImplementationOnce((entity) => entity);
        await job();
        expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'application-healthy' }));
        expect(statusRepositoryMock.save).toHaveBeenCalledWith(
          expect.objectContaining({ endpoint: expect.objectContaining({ status: 'online' }) })
        );
      });

      it('can updated application unhealthy', async () => {
        getEndpointResponse.mockResolvedValueOnce({ status: 200 });
        endpointRepositoryMock.save.mockImplementationOnce((entity) => entity);
        endpointRepositoryMock.findRecentByUrlAndApplicationId.mockReturnValueOnce([
          {
            ok: false,
            url: 'https//test.co',
            status: 500,
            timestamp: new Date(),
            responseTime: 250,
          },
          {
            ok: false,
            url: 'https//test.co',
            status: 500,
            timestamp: new Date(),
            responseTime: 250,
          },
          {
            ok: false,
            url: 'https//test.co',
            status: 500,
            timestamp: new Date(),
            responseTime: 250,
          },
        ]);
        statusRepositoryMock.get.mockResolvedValueOnce(
          new ServiceStatusApplicationEntity(statusRepositoryMock, {
            tenantId: tenantId.toString(),
            _id: 'test-app',
            name: 'test-app',
            endpoint: { url: 'https://test.co', status: 'online' },
          } as ServiceStatusApplication)
        );
        statusRepositoryMock.save.mockImplementationOnce((entity) => entity);
        await job();
        expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'application-unhealthy' }));
        expect(statusRepositoryMock.save).toHaveBeenCalledWith(
          expect.objectContaining({ endpoint: expect.objectContaining({ status: 'offline' }) })
        );
      });

      it('can not update when status unchanged', async () => {
        getEndpointResponse.mockResolvedValueOnce({ status: 200 });
        endpointRepositoryMock.save.mockImplementationOnce((entity) => entity);
        endpointRepositoryMock.findRecentByUrlAndApplicationId.mockReturnValueOnce([
          {
            ok: false,
            url: 'https//test.co',
            status: 500,
            timestamp: new Date(),
            responseTime: 250,
          },
          {
            ok: false,
            url: 'https//test.co',
            status: 500,
            timestamp: new Date(),
            responseTime: 250,
          },
          {
            ok: false,
            url: 'https//test.co',
            status: 500,
            timestamp: new Date(),
            responseTime: 250,
          },
        ]);
        statusRepositoryMock.get.mockResolvedValueOnce(
          new ServiceStatusApplicationEntity(statusRepositoryMock, {
            tenantId: tenantId.toString(),
            _id: 'test-app',
            name: 'test-app',
            endpoint: { url: 'https://test.co', status: 'offline' },
          } as ServiceStatusApplication)
        );
        statusRepositoryMock.save.mockImplementationOnce((entity) => entity);
        await job();
        expect(eventServiceMock.send).not.toHaveBeenCalled();
        expect(statusRepositoryMock.save).not.toHaveBeenCalled();
      });
    });
  });

  describe('getNewEndpointStatus', () => {
    it('can set online status from n/a', () => {
      const result = getNewEndpointStatus('n/a', [{ ok: true } as EndpointStatusEntryEntity]);
      expect(result).toBe('online');
    });

    it('can set offline status from n/a', () => {
      const result = getNewEndpointStatus('n/a', [{ ok: false } as EndpointStatusEntryEntity]);
      expect(result).toBe('offline');
    });

    it('can set online status from pending', () => {
      const result = getNewEndpointStatus('pending', [{ ok: true } as EndpointStatusEntryEntity]);
      expect(result).toBe('online');
    });

    it('can set offline status from pending', () => {
      const result = getNewEndpointStatus('pending', [{ ok: false } as EndpointStatusEntryEntity]);
      expect(result).toBe('offline');
    });

    it('can set offline status from online', () => {
      const result = getNewEndpointStatus('online', [
        { ok: true } as EndpointStatusEntryEntity,
        { ok: false } as EndpointStatusEntryEntity,
        { ok: false } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
        { ok: false } as EndpointStatusEntryEntity,
      ]);

      expect(result).toBe('offline');
    });

    // Online is maintained if bad responses don't exceed limit.
    it('can maintain online status', () => {
      const result = getNewEndpointStatus('online', [
        { ok: true } as EndpointStatusEntryEntity,
        { ok: false } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
        { ok: false } as EndpointStatusEntryEntity,
      ]);

      expect(result).toBe('online');
    });

    it('can set online status from offline', () => {
      const result = getNewEndpointStatus('offline', [
        { ok: true } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
      ]);

      expect(result).toBe('online');
    });

    // Offline is maintained if bad responses don't go below limit.
    it('can maintain offline status', () => {
      const result = getNewEndpointStatus('offline', [
        { ok: true } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
        { ok: false } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
        { ok: true } as EndpointStatusEntryEntity,
      ]);

      expect(result).toBe('offline');
    });
  });
});
