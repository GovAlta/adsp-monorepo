import { adspId } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { NotificationConfiguration } from '../configuration';
import { SubscriptionRepository } from '../repository';
import { Channel, Notification } from '../types';
import { createProcessEventJob } from './processEvent';

describe('createProcessEventJob', () => {
  const logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
  };

  const templateServiceMock = {
    generateMessage: jest.fn(),
  };

  const repositoryMock = {
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
      templateService: templateServiceMock,
      subscriptionRepository: (repositoryMock as unknown) as SubscriptionRepository,
      queueService: (queueServiceMock as unknown) as WorkQueueService<Notification>,
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
        templateService: templateServiceMock,
        subscriptionRepository: (repositoryMock as unknown) as SubscriptionRepository,
        queueService: (queueServiceMock as unknown) as WorkQueueService<Notification>,
      });

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const type = {
        id: 'test',
        name: 'Test Type',
        description: '',
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
      tokenProviderMock.getAccessToken.mockResolvedValue('token');
      configurationServiceMock.getConfiguration.mockResolvedValue(configuration);
      repositoryMock.getSubscriptions.mockResolvedValue({
        results: [],
        page: {},
      });

      job(
        {
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
  });
});
