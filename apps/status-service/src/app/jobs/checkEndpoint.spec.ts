import { createCheckEndpointJob, getNewEndpointStatus } from '../jobs/checkEndpoint';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusApplication } from '../types';
import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

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
    findRecent: jest.fn(),
    deleteOldUrlStatus: jest.fn(),
    get: jest.fn(),
    find: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
    deleteAll: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
  };

  const mockTokenProvider = {
    getAccessToken: jest.fn(),
  };

  const serviceDirectoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
    getResourceUrl: jest.fn(() => Promise.resolve(new URL('http:/localhost:80'))),
  };

  describe('createCheckEndpointJob', () => {
    it('can create job', () => {
      const job = createCheckEndpointJob({
        app: { url: 'https//test.co', appKey: 'the-key', name: 'bob', tenantId: tenantId },
        getEndpointResponse: jest.fn(),
        logger: loggerMock,
        serviceStatusRepository: statusRepositoryMock,
        endpointStatusEntryRepository: endpointRepositoryMock,
        eventService: eventServiceMock,
        tokenProvider: mockTokenProvider,
        directory: serviceDirectoryMock,
        configurationService: configurationServiceMock,
        serviceId: adspId`urn:ads:platform:test-service`,
      });

      expect(job).toBeTruthy();
    });

    describe('checkEndpointJob', () => {
      const getEndpointResponse = jest.fn();
      const job = createCheckEndpointJob({
        app: {
          url: 'https//test.co',
          name: 'bobs balloons',
          appKey: 'the-other-key',
          tenantId: tenantId,
        },
        getEndpointResponse: jest.fn(),
        logger: loggerMock,
        serviceStatusRepository: statusRepositoryMock,
        endpointStatusEntryRepository: endpointRepositoryMock,
        eventService: eventServiceMock,
        tokenProvider: mockTokenProvider,
        directory: serviceDirectoryMock,
        configurationService: configurationServiceMock,
        serviceId: adspId`urn:ads:platform:test-service`,
      });

      beforeEach(() => {
        eventServiceMock.send.mockReset();
        endpointRepositoryMock.save.mockReset();
        endpointRepositoryMock.findRecentByUrlAndApplicationId.mockReset();
        statusRepositoryMock.get.mockReset();
        statusRepositoryMock.save.mockReset();
        configurationServiceMock.getConfiguration.mockReset();
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

        mockTokenProvider.getAccessToken.mockResolvedValueOnce('test');
        configurationServiceMock.getConfiguration
          .mockReturnValueOnce({})
          .mockResolvedValueOnce({ applicationWebhookIntervals: {} });

        statusRepositoryMock.get.mockResolvedValueOnce(
          new ServiceStatusApplicationEntity(statusRepositoryMock, {
            _id: 'test-app',
            endpoint: { status: 'n/a' },
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
        mockTokenProvider.getAccessToken.mockResolvedValueOnce('test');
        configurationServiceMock.getConfiguration
          .mockReturnValueOnce({})
          .mockResolvedValueOnce({ applicationWebhookIntervals: {} });

        statusRepositoryMock.get.mockResolvedValueOnce(
          new ServiceStatusApplicationEntity(statusRepositoryMock, {
            _id: 'test-app',
            endpoint: { status: 'online' },
          } as ServiceStatusApplication)
        );

        statusRepositoryMock.save.mockImplementationOnce((entity) => entity);
        await job();
        expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'application-unhealthy' }));
        expect(statusRepositoryMock.save).toHaveBeenCalledWith(
          expect.objectContaining({ endpoint: expect.objectContaining({ status: 'offline' }) })
        );
      });

      it('sends a managed application down event', async () => {
        const applicationWebhookIntervals = {
          asdf: {
            appId: 'the-other-key',
            waitTimeInterval: 3,
          },
        };
        const webHooks = {
          asdf: {
            id: 'asdf',
            name: 'Fubar',
            url: 'http://www.localhost:3000/uptime',
            targetId: 'the-other-key',
            intervalMinutes: 3,
            description: 'asdfasdf',
            eventTypes: [
              { id: 'status-service:monitored-service-down' },
              { id: 'status-service:monitored-service-up' },
            ],
          },
        };
        getEndpointResponse.mockResolvedValueOnce({ status: 200 });
        endpointRepositoryMock.save.mockImplementationOnce((entity) => entity);
        endpointRepositoryMock.findRecentByUrlAndApplicationId.mockReturnValue([
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
        mockTokenProvider.getAccessToken.mockResolvedValueOnce('test');
        configurationServiceMock.getConfiguration.mockResolvedValueOnce({ webhooks: webHooks }).mockResolvedValueOnce({
          applicationWebhookIntervals: applicationWebhookIntervals,
        });

        statusRepositoryMock.get.mockResolvedValueOnce(
          new ServiceStatusApplicationEntity(statusRepositoryMock, {
            _id: 'test-app',
            endpoint: { status: 'online' },
          } as ServiceStatusApplication)
        );
        statusRepositoryMock.save.mockImplementationOnce((entity) => entity);
        await job();
        expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'monitored-service-down' }));
      });

      it('does not send a managed application down event because app is already down', async () => {
        const applicationWebhookIntervals = {
          asdf: {
            appId: 'the-other-key',
            waitTimeInterval: 3,
          },
        };
        const webHooks = {
          asdf: {
            id: 'asdf',
            name: 'Fubar',
            url: 'http://www.localhost:3000/uptime',
            targetId: 'the-other-key',
            intervalMinutes: 3,
            description: 'asdfasdf',
            eventTypes: [
              { id: 'status-service:monitored-service-down' },
              { id: 'status-service:monitored-service-up' },
            ],
            appCurrentlyUp: false,
          },
        };
        getEndpointResponse.mockResolvedValueOnce({ status: 200 });
        endpointRepositoryMock.save.mockImplementationOnce((entity) => entity);
        endpointRepositoryMock.findRecentByUrlAndApplicationId.mockReturnValue([
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
        mockTokenProvider.getAccessToken.mockResolvedValueOnce('test');
        configurationServiceMock.getConfiguration.mockResolvedValueOnce({ webhooks: webHooks }).mockResolvedValueOnce({
          applicationWebhookIntervals: applicationWebhookIntervals,
        });

        statusRepositoryMock.get.mockResolvedValueOnce(
          new ServiceStatusApplicationEntity(statusRepositoryMock, {
            _id: 'test-app',
            endpoint: { status: 'online' },
          } as ServiceStatusApplication)
        );
        statusRepositoryMock.save.mockImplementationOnce((entity) => entity);
        await job();
        expect(eventServiceMock.send).not.toHaveBeenCalledWith(
          expect.objectContaining({ name: 'monitored-service-down' })
        );
      });

      it('sends a managed application up event', async () => {
        const applicationWebhookIntervals = {
          asdf: {
            appId: 'the-other-key',
            waitTimeInterval: 3,
          },
        };
        const webHooks = {
          asdf: {
            id: 'asdf',
            name: 'Fubar',
            url: 'http://www.localhost:3000/uptime',
            targetId: 'the-other-key',
            description: 'asdfasdf',
            eventTypes: [
              { id: 'status-service:monitored-service-down' },
              { id: 'status-service:monitored-service-up' },
            ],
          },
        };
        getEndpointResponse.mockResolvedValueOnce({ status: 200 });
        endpointRepositoryMock.save.mockImplementationOnce((entity) => entity);
        endpointRepositoryMock.findRecentByUrlAndApplicationId.mockReturnValue([
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
        mockTokenProvider.getAccessToken.mockResolvedValueOnce('test');
        configurationServiceMock.getConfiguration.mockResolvedValueOnce({ webhooks: webHooks }).mockResolvedValueOnce({
          applicationWebhookIntervals: applicationWebhookIntervals,
        });

        statusRepositoryMock.get.mockResolvedValueOnce(
          new ServiceStatusApplicationEntity(statusRepositoryMock, {
            _id: 'test-app',
            endpoint: { status: 'online' },
          } as ServiceStatusApplication)
        );
        axiosMock.patch.mockResolvedValueOnce('success');
        statusRepositoryMock.save.mockImplementationOnce((entity) => entity);
        await job();
        expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'monitored-service-up' }));
      });

      it('can not update when status unchanged', async () => {
        const applicationWebhookIntervals = {
          asdf: {
            appId: 'the-other-key',
            waitTimeInterval: 3,
          },
        };

        getEndpointResponse.mockResolvedValueOnce({ status: 200 });
        endpointRepositoryMock.save.mockImplementationOnce((entity) => entity);
        endpointRepositoryMock.findRecentByUrlAndApplicationId.mockReturnValueOnce([
          {
            ok: false,
            status: 500,
            timestamp: new Date(),
            responseTime: 250,
          },
          {
            ok: false,
            status: 500,
            timestamp: new Date(),
            responseTime: 250,
          },
          {
            ok: false,
            status: 500,
            timestamp: new Date(),
            responseTime: 250,
          },
        ]);
        mockTokenProvider.getAccessToken.mockResolvedValueOnce('test');
        configurationServiceMock.getConfiguration.mockResolvedValueOnce({}).mockResolvedValueOnce({
          applicationWebhookIntervals: applicationWebhookIntervals,
        });

        statusRepositoryMock.get.mockResolvedValueOnce(
          new ServiceStatusApplicationEntity(statusRepositoryMock, {
            _id: 'test-app',
            endpoint: { status: 'offline' },
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
