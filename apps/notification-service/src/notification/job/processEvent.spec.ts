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
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
    getNamedServiceConfiguration: jest.fn(),
    clearCached: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const templateServiceMock = {
    generateMessage: jest.fn(),
  };

  const attachmentServiceMock = {
    getAttachment: jest.fn(),
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

  const queueServiceMock = {
    enqueue: jest.fn(),
  };

  beforeEach(() => {
    queueServiceMock.enqueue.mockReset();
    configurationServiceMock.getConfiguration.mockReset();
    configurationServiceMock.clearCached.mockReset();
    tokenProviderMock.getAccessToken.mockReset();
    repositoryMock.getSubscriptions.mockReset();
    eventServiceMock.send.mockReset();
  });

  it('can create job', () => {
    const job = createProcessEventJob({
      logger,
      serviceId: adspId`urn:ads:platform:notification-service`,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,

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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          test: type,
        },
        {},
        tenantId,
      );
      configuration.email = {
        fromEmail: 'no-reply@test.com',
      };
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
        null,
        subscriber,
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
          traceparent: '123',
        },
        true,
        (err) => {
          expect(err).toBeFalsy();
        },
      );

      expect(queueServiceMock.enqueue).toHaveBeenCalled();

      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ subscriber: expect.objectContaining({ id: 'test' }), to: 'test@testco.org' }),
      );
    });

    it('can process event for multiple subscribers', async () => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,

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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          test: type,
        },
        {},
        tenantId,
      );

      configuration.email = {
        fromEmail: 'no-reply@test.com',
      };

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
        configuration.getNotificationType('test'),
        subscriberA,
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
        configuration.getNotificationType('test'),
        subscriberB,
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
          traceparent: '123',
        },
        true,
        (err) => {
          expect(err).toBeFalsy();
        },
      );

      expect(queueServiceMock.enqueue).toHaveBeenCalledTimes(2);
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ subscriber: expect.objectContaining({ id: 'testA' }), to: 'testA@testco.org' }),
      );
      expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ subscriber: expect.objectContaining({ id: 'testB' }), to: 'testB@testco.org' }),
      );
    });

    it('does not double process custom event', (done) => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,

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
        logger,
        templateServiceMock,
        attachmentServiceMock,
        {
          test: type,
        },
        {},
        tenantId,
      );
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce(configuration);

      repositoryMock.getSubscriptions.mockResolvedValueOnce({
        results: [],
        page: {},
      });

      job(
        {
          tenantId,
          namespace: 'notification-service',
          name: 'sent',
          timestamp: new Date(),
          payload: { tenantId, typeId: 'test', subscriberId: 'test' },
          traceparent: '123',
        },
        true,
        (err) => {
          expect(err).toBeFalsy();
          done();
        },
      );
    });

    // clean-code-ignore: 2.16
    it('logs an error and continues when email fromEmail is not configured after retries exhausted', async () => {
      jest.useFakeTimers();
      try {
        const job = createProcessEventJob({
          logger,
          serviceId: adspId`urn:ads:platform:notification-service`,
          tokenProvider: tokenProviderMock,
          configurationService: configurationServiceMock,
          eventService: eventServiceMock,
          tenantService: tenantServiceMock,
          directory: directoryMock,
          subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
          queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
        });

        const type = {
          id: 'test',
          name: 'Test Type',
          description: '',
          publicSubscribe: true,
          subscriberRoles: [],
          channels: [Channel.email],
          events: [{ namespace: 'test', name: 'test-run', templates: { [Channel.email]: { subject: '', body: '' } } }],
        };
        const configuration = new NotificationConfiguration(
          logger,
          templateServiceMock,
          attachmentServiceMock,
          { test: type },
          {},
          tenantId,
        );
        // Deliberately omit configuration.email.fromEmail to simulate config never becoming ready

        tokenProviderMock.getAccessToken.mockResolvedValue('token');
        configurationServiceMock.getConfiguration.mockResolvedValue(configuration);
        repositoryMock.getSubscriptions.mockResolvedValue({ results: [], page: {} });

        let capturedErr: unknown;
        const jobDone = new Promise<void>((resolve) => {
          job(
            { tenantId, namespace: 'test', name: 'test-run', timestamp: new Date(), payload: {}, traceparent: '123' },
            true,
            (err) => {
              capturedErr = err;
              resolve();
            },
          );
        });

        await jest.runAllTimersAsync();
        await jobDone;

        expect(capturedErr).toBeFalsy();
        // clean-code-ignore: 2.11
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining(`Configuration not ready: email fromEmail is not set for tenant ${tenantId}`),
          expect.anything(),
        );
        expect(queueServiceMock.enqueue).not.toHaveBeenCalled();
        expect(eventServiceMock.send).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'notification-config-retried',
            payload: expect.objectContaining({ retries: 5, resolved: false }),
          }),
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('retries and succeeds when email fromEmail becomes available', async () => {
      jest.useFakeTimers();
      try {
        const job = createProcessEventJob({
          logger,
          serviceId: adspId`urn:ads:platform:notification-service`,
          tokenProvider: tokenProviderMock,
          configurationService: configurationServiceMock,
          eventService: eventServiceMock,
          tenantService: tenantServiceMock,
          directory: directoryMock,
          subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
          queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
        });

        const type = {
          id: 'test',
          name: 'Test Type',
          description: '',
          publicSubscribe: true,
          subscriberRoles: [],
          channels: [Channel.email],
          events: [{ namespace: 'test', name: 'test-run', templates: { [Channel.email]: { subject: '', body: '' } } }],
        };

        const configWithoutEmail = new NotificationConfiguration(
          logger,
          templateServiceMock,
          attachmentServiceMock,
          { test: type },
          {},
          tenantId,
        );
        const configWithEmail = new NotificationConfiguration(
          logger,
          templateServiceMock,
          attachmentServiceMock,
          { test: type },
          {},
          tenantId,
        );
        configWithEmail.email = { fromEmail: 'no-reply@test.com' };

        tokenProviderMock.getAccessToken.mockResolvedValue('token');
        configurationServiceMock.getConfiguration
          .mockResolvedValueOnce(configWithoutEmail)
          .mockResolvedValueOnce(configWithEmail);

        const subscriber = new SubscriberEntity(repositoryMock as unknown as SubscriptionRepository, {
          id: 'test',
          tenantId,
          addressAs: 'Tester',
          channels: [{ channel: Channel.email, address: 'test@testco.org', verified: false }],
        });
        const subscription = new SubscriptionEntity(
          repositoryMock as unknown as SubscriptionRepository,
          { tenantId, typeId: 'test', subscriberId: 'test', criteria: {} },
          null,
          subscriber,
        );
        repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [subscription], page: {} });

        let capturedErr: unknown;
        const jobDone = new Promise<void>((resolve) => {
          job(
            { tenantId, namespace: 'test', name: 'test-run', timestamp: new Date(), payload: {}, traceparent: '123' },
            true,
            (err) => {
              capturedErr = err;
              resolve();
            },
          );
        });

        await jest.runAllTimersAsync();
        await jobDone;

        expect(capturedErr).toBeFalsy();
        expect(queueServiceMock.enqueue).toHaveBeenCalledWith(
          expect.objectContaining({ subscriber: expect.objectContaining({ id: 'test' }), to: 'test@testco.org' }),
        );
        expect(configurationServiceMock.clearCached).toHaveBeenCalledWith(
          tenantId,
          'platform',
          'notification-service',
        );
        expect(eventServiceMock.send).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'notification-config-retried',
            payload: expect.objectContaining({ retries: 1, resolved: true }),
          }),
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('does not signal retry when matched types have no email channel', (done) => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,
        tenantService: tenantServiceMock,
        directory: directoryMock,
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
      });

      const type = {
        id: 'test-sms',
        name: 'Test SMS Type',
        description: '',
        publicSubscribe: true,
        subscriberRoles: [],
        channels: [Channel.sms],
        events: [{ namespace: 'test', name: 'test-run', templates: { [Channel.sms]: { subject: '', body: '' } } }],
      };
      const configuration = new NotificationConfiguration(
        logger,
        templateServiceMock,
        attachmentServiceMock,
        { 'test-sms': type },
        {},
        tenantId,
      );
      // Omit configuration.email.fromEmail — should not matter for SMS-only types

      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      configurationServiceMock.getConfiguration.mockResolvedValueOnce(configuration);
      repositoryMock.getSubscriptions.mockResolvedValueOnce({ results: [], page: {} });

      job(
        { tenantId, namespace: 'test', name: 'test-run', timestamp: new Date(), payload: {}, traceparent: '123' },
        true,
        (err) => {
          expect(err).toBeFalsy();
          expect(queueServiceMock.enqueue).not.toHaveBeenCalled();
          expect(eventServiceMock.send).not.toHaveBeenCalledWith(
            expect.objectContaining({ name: 'notification-config-retried' }),
          );
          done();
        },
      );
    });

    it('handles errors', (done) => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,

        tenantService: tenantServiceMock,
        directory: directoryMock,
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
      });

      tokenProviderMock.getAccessToken.mockRejectedValueOnce(new Error('Error'));

      job(
        {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          namespace: 'test',
          name: 'test-run',
          timestamp: new Date(),
          payload: {},
          traceparent: '123',
        },
        true,
        (err) => {
          expect(err).toBeTruthy();
          done();
        },
      );
    });

    it('skips events from notification-service namespace', (done) => {
      const job = createProcessEventJob({
        logger,
        serviceId: adspId`urn:ads:platform:notification-service`,
        tokenProvider: tokenProviderMock,
        configurationService: configurationServiceMock,
        eventService: eventServiceMock,

        tenantService: tenantServiceMock,
        directory: directoryMock,
        subscriptionRepository: repositoryMock as unknown as SubscriptionRepository,
        queueService: queueServiceMock as unknown as WorkQueueService<NotificationWorkItem>,
      });

      job(
        {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          namespace: 'notification-service',
          name: 'sent',
          timestamp: new Date(),
          payload: { tenantId, typeId: 'test', subscriberId: 'test' },
          traceparent: '123',
        },
        true,
        (err) => {
          expect(err).toBeFalsy();
          expect(queueServiceMock.enqueue).not.toHaveBeenCalled();
          done();
        },
      );
    });
  });
});
