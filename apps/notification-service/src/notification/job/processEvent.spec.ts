import { adspId } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { NotificationConfiguration } from '../configuration';
import { SubscriberEntity, SubscriptionEntity } from '../model';
import { SubscriptionRepository } from '../repository';
import { Channel, Notification } from '../types';
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

  const repositoryMock = {
    getSubscriptions: jest.fn(),
  };

  const repositoryDoubleMock = {
    getSubscriptions: jest.fn(),
  };

  const queueServiceMock = {
    enqueue: jest.fn(),
  };

  it('can create job', () => {
    const job = createProcessEventJob({
      logger,
      serviceId: adspId`urn:ads:platform:notification-service`,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
      templateService: templateServiceMock,
      subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
      queueService: queueServiceMock as unknown as WorkQueueService<Notification>,
    });
    expect(job).toBeTruthy();
  });

  describe('processEventJob', () => {
    it('can process event', (done) => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,
        templateService: templateServiceMock,
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<Notification>,
      });

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const type = {
        id: 'test',
        name: 'Test Type',
        description: '',
        publicSubscribe: true,
        subscriberRoles: [],
        events: [
          {
            namespace: 'test',
            name: 'test-run',
            templates: {
              [Channel.email]: { subject: '', body: '' },
              [Channel.sms]: null,
              [Channel.mail]: null,
            },
            channels: [Channel.email],
          },
        ],
      };
      const configuration = new NotificationConfiguration(
        {
          test: type,
        },
        tenantId
      );
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce([configuration]);

      const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
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

      job(
        {
          tenantId,
          namespace: 'test',
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

    it('does not double process custom event', (done) => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,
        templateService: templateServiceMock,
        subscriptionRepository: repositoryDoubleMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<Notification>,
      });

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const type = {
        id: 'test',
        name: 'Test Type',
        description: '',
        publicSubscribe: true,
        subscriberRoles: [],
        events: [
          {
            namespace: 'test',
            name: 'test-run',
            templates: {
              [Channel.email]: { subject: 'hello', body: 'regular body' },
              [Channel.sms]: null,
              [Channel.mail]: null,
            },
            channels: [Channel.email],
          },
        ],
      };
      const customType = JSON.parse(JSON.stringify(type));
      customType.events[0].channels = [];
      customType.events[0].templates = {
        [Channel.email]: { subject: 'hello there', body: 'i customize body' },
        [Channel.sms]: null,
        [Channel.mail]: null,
      };
      const configuration = new NotificationConfiguration(
        {
          test: customType,
        },
        tenantId
      );
      const options = new NotificationConfiguration({
        test2: type,
      });
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce([configuration, options]);

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
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<Notification>,
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
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<Notification>,
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
