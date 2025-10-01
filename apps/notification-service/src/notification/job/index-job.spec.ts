import { Subscribable } from 'rxjs';
import { Logger } from 'winston';
import {
  AdspId,
  ConfigurationService,
  EventService,
  ServiceDirectory,
  TenantService,
  TokenProvider,
} from '@abgov/adsp-service-sdk';
import { DomainEventWorkItem, WorkQueueService } from '@core-services/core-common';
import { createProcessEventJob } from './processEvent';
import { createSendNotificationJob } from './sendNotification';
import { createJobs } from './index';
import { SubscriptionRepository } from '../repository';
import { TemplateService } from '../template';
import { NotificationWorkItem, Providers } from '../types';

jest.mock('./processEvent');
jest.mock('./sendNotification');

describe('createJobs', () => {
  let serviceId: AdspId;
  let logger: Logger;
  let tokenProvider: TokenProvider;
  let tenantService: TenantService;
  let directory: ServiceDirectory;
  let configurationService: ConfigurationService;
  let eventService: EventService;
  let templateService: TemplateService;
  let events: Subscribable<DomainEventWorkItem>;
  let queueService: WorkQueueService<NotificationWorkItem>;
  let subscriptionRepository: SubscriptionRepository;
  let providers: Providers;

  beforeEach(() => {
    serviceId = {} as AdspId;
    logger = { info: jest.fn() } as unknown as Logger;
    tokenProvider = {} as TokenProvider;
    tenantService = {} as TenantService;
    directory = {} as ServiceDirectory;
    configurationService = {} as ConfigurationService;
    eventService = {} as EventService;
    templateService = {} as TemplateService;
    events = {
      subscribe: jest.fn(),
    } as unknown as Subscribable<DomainEventWorkItem>;
    queueService = {
      getItems: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    } as unknown as WorkQueueService<NotificationWorkItem>;
    subscriptionRepository = {} as SubscriptionRepository;
    providers = {} as Providers;

    (createProcessEventJob as jest.Mock).mockReturnValue(jest.fn());
    (createSendNotificationJob as jest.Mock).mockReturnValue(jest.fn());
  });

  it('should create and subscribe to processEventJob', () => {
    createJobs({
      serviceId,
      logger,
      tokenProvider,
      tenantService,
      directory,
      configurationService,
      eventService,
      events,
      queueService,
      subscriptionRepository,
      providers,
    });

    expect(createProcessEventJob).toHaveBeenCalledWith({
      serviceId,
      logger,
      tokenProvider,
      tenantService,
      directory,
      configurationService,
      eventService,
      subscriptionRepository,
      queueService,
    });

    const processEventJob = (createProcessEventJob as jest.Mock).mock.results[0].value;
    expect(events.subscribe).toHaveBeenCalledWith(expect.any(Function));
    const subscribeCallback = (events.subscribe as jest.Mock).mock.calls[0][0];
    const doneFn = jest.fn();
    subscribeCallback({ item: {}, done: doneFn });
    expect(processEventJob).toHaveBeenCalledWith({}, doneFn);
  });

  it('should create and subscribe to sendNotificationJob', () => {
    createJobs({
      serviceId,
      logger,
      tokenProvider,
      tenantService,
      directory,
      configurationService,
      eventService,
      events,
      queueService,
      subscriptionRepository,
      providers,
    });

    expect(createSendNotificationJob).toHaveBeenCalledWith({
      logger,
      eventService,
      providers,
    });

    const sendNotificationJob = (createSendNotificationJob as jest.Mock).mock.results[0].value;
    expect(queueService.getItems).toHaveBeenCalled();
    const queueItemsObservable = queueService.getItems() as unknown as {
      subscribe: jest.Mock;
    };
    expect(queueItemsObservable.subscribe).toHaveBeenCalledWith(expect.any(Function));
    const queueCallback = queueItemsObservable.subscribe.mock.calls[0][0];
    const retryOnError = jest.fn();
    const doneFn = jest.fn();
    queueCallback({ item: {}, retryOnError, done: doneFn });
    expect(sendNotificationJob).toBeTruthy();
  });
});
