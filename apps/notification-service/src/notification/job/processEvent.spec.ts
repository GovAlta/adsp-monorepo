import { adspId } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { NotificationConfiguration } from '../configuration';
import { SubscriberEntity, SubscriptionEntity } from '../model';
import { SubscriptionRepository } from '../repository';
import { Channel, NotificationWorkItem } from '../types';
import { createProcessEventJob } from './processEvent';

describe('createProcessEventJob', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const templateServiceMock = {
    generateMessage: jest.fn(),
  };

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn((id) => Promise.resolve({ id, name: 'Test', realm: 'test' })),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-service'))),
    getResourceUrl: jest.fn(),
  };

  const repositoryMock = {
    getSubscriptions: jest.fn(),
  };

  const repositoryDoubleMock = {
    getSubscriptions: jest.fn(),
  };

  const queueServiceMock = {
    enqueue: jest.fn(),
  };

  beforeEach(() => {
    queueServiceMock.enqueue.mockReset();
  });

  it('can create job', () => {
    const job = createProcessEventJob({
      logger,
      serviceId: adspId`urn:ads:platform:notification-service`,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
      templateService: templateServiceMock,
      tenantService: tenantServiceMock,
      directory: directoryMock,
      subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
      queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
    });
    expect(job).toBeTruthy();
  });

  describe('processEventJob', () => {
    it('can process event', async () => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,
        templateService: templateServiceMock,
        tenantService: tenantServiceMock,
        directory: directoryMock,
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
      });

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const type = {
        id: 'test',
        name: 'Test Type',
        description: '',
        publicSubscribe: true,
        subscriberRoles: [],
        channels: [Channel.email],
        events: [
          {
            namespace: 'test',
            name: 'test-run',
            templates: {
              [Channel.email]: { subject: '', body: '' },
              [Channel.sms]: null,
              [Channel.mail]: null,
            },
          },
        ],
      };
      const configuration = new NotificationConfiguration(
        {
          test: type,
        },
        {},
        tenantId
      );
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce(configuration);

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        id: 'test',
        tenantId,
        addressAs: 'Tester',
        channels: [
          {
            channel: Channel.email,
            address: 'test@testco.org',
            verified: false,
          },
        ],
      });

      const subscription = new SubscriptionEntity(
        repositoryMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test', subscriberId: 'test', criteria: {} },
        subscriber
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({
        results: [subscription],
        page: {},
      });

      await job(
        {
          tenantId,
          namespace: 'test',
          name: 'test-run',
          timestamp: new Date(),
          payload: {},
        },
        (err) => {
          expect(err).toBeFalsy();
        }
      );

      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ subscriber: expect.objectContaining({ id: 'test' }), to: 'test@testco.org' })
      );
    });

    it('can process event for multiple subscribers', async () => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,
        templateService: templateServiceMock,
        tenantService: tenantServiceMock,
        directory: directoryMock,
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
      });

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const type = {
        id: 'test',
        name: 'Test Type',
        description: '',
        publicSubscribe: true,
        subscriberRoles: [],
        channels: [Channel.email],
        events: [
          {
            namespace: 'test',
            name: 'test-run',
            templates: {
              [Channel.email]: { subject: '', body: '' },
              [Channel.sms]: null,
              [Channel.mail]: null,
            },
          },
        ],
      };
      const configuration = new NotificationConfiguration(
        {
          test: type,
        },
        {},
        tenantId
      );
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce(configuration);

      const subscriberA = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        id: 'testA',
        tenantId,
        addressAs: 'TesterA',
        channels: [
          {
            channel: Channel.email,
            address: 'testA@testco.org',
            verified: false,
          },
        ],
      });

      const subscriptionA = new SubscriptionEntity(
        repositoryMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test', subscriberId: 'testA', criteria: {} },
        subscriberA
      );

      const subscriberB = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
        id: 'testB',
        tenantId,
        addressAs: 'TesterB',
        channels: [
          {
            channel: Channel.email,
            address: 'testB@testco.org',
            verified: false,
          },
        ],
      });

      const subscriptionB = new SubscriptionEntity(
        repositoryMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test', subscriberId: 'testB', criteria: {} },
        subscriberB
      );
      repositoryMock.getSubscriptions.mockResolvedValueOnce({
        results: [subscriptionA, subscriptionB],
        page: {},
      });

      await job(
        {
          tenantId,
          namespace: 'test',
          name: 'test-run',
          timestamp: new Date(),
          payload: {},
        },
        (err) => {
          expect(err).toBeFalsy();
        }
      );

      expect(queueServiceMock.enqueue).toHaveBeenCalledTimes(2);
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ subscriber: expect.objectContaining({ id: 'testA' }), to: 'testA@testco.org' })
      );
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ subscriber: expect.objectContaining({ id: 'testB' }), to: 'testB@testco.org' })
      );
    });

    it('does not double process custom event', (done) => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,
        templateService: templateServiceMock,
        tenantService: tenantServiceMock,
        directory: directoryMock,
        subscriptionRepository: repositoryDoubleMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
      });

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const type = {
        id: 'test',
        name: 'Test Type',
        description: '',
        publicSubscribe: true,
        subscriberRoles: [],
        channels: [Channel.email],
        events: [
          {
            namespace: 'test',
            name: 'test-run',
            templates: {
              [Channel.email]: { subject: 'hello', body: 'regular body' },
              [Channel.sms]: null,
              [Channel.mail]: null,
            },
          },
        ],
      };
      const customType = JSON.parse(JSON.stringify(type));
      customType.events[0].templates = {
        [Channel.email]: { subject: 'hello there', body: 'i customize body' },
        [Channel.sms]: null,
        [Channel.mail]: null,
      };
      const configuration = new NotificationConfiguration(
        {
          test: customType,
        },
        {
          test: type,
        },
        tenantId
      );
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce(configuration);

      const subscriber = new SubscriberEntity(repositoryDoubleMock as unknown as SubscriptionRepository, {
        tenantId,
        addressAs: 'Tester',
        channels: [
          {
            channel: Channel.email,
            address: 'test@testco.org',
            verified: false,
          },
        ],
      });

      const subscription = new SubscriptionEntity(
        repositoryDoubleMock as unknown as SubscriptionRepository,
        { tenantId, typeId: 'test', subscriberId: 'test', criteria: {} },
        subscriber
      );

      repositoryDoubleMock.getSubscriptions.mockResolvedValue({
        results: [subscription],
        page: {},
      });

      job(
        {
          tenantId,
          namespace: 'test',
          name: 'test-run',
          timestamp: new Date(),
          payload: {},
        },
        (err) => {
          expect(repositoryDoubleMock.getSubscriptions).toHaveBeenCalledTimes(1);
          expect(err).toBeFalsy();
          done();
        }
      );
    });

    it('can handle error on processing', (done) => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,
        templateService: templateServiceMock,
        tenantService: tenantServiceMock,
        directory: directoryMock,
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
      });
      const error = new Error('Something is terribly wrong.');
      tokenProviderMock.getAccessToken.mockRejectedValueOnce(error);

      job(
        {
          tenantId,
          namespace: 'test',
          name: 'test-run',
          timestamp: new Date(),
          payload: {},
        },
        (err) => {
          expect(err).toBe(error);
          done();
        }
      );
    });

    it('can skip notification-service event', (done) => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,
        templateService: templateServiceMock,
        tenantService: tenantServiceMock,
        directory: directoryMock,
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
      });

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

      job(
        {
          tenantId,
          namespace: 'notification-service',
          name: 'test-run',
          timestamp: new Date(),
          payload: {},
        },
        (err) => {
          expect(err).toBeFalsy();
          done();
        }
      );
    });
  });
});
