import { Application } from 'express';
import { Logger } from 'winston';
import {
  AdspId,
  ConfigurationService,
  EventService,
  ServiceDirectory,
  TenantService,
  TokenProvider,
} from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, DomainEventSubscriberService, WorkQueueService } from '@core-services/core-common';
import { createJobs } from './job';
import { createSubscriptionRouter } from './router';
import { NotificationWorkItem, Providers } from './types';
import { applyNotificationMiddleware } from './index';
import { SubscriptionRepository, Repositories } from './repository';
import { VerifyService } from './verify';

jest.mock('./job');
jest.mock('./router');

describe('applyNotificationMiddleware', () => {
  let app: Partial<Application>;
  let serviceId: AdspId;
  let logger: Logger;
  let tokenProvider: TokenProvider;
  let configurationService: ConfigurationService;
  let directory: ServiceDirectory;
  let eventService: EventService;
  let tenantService: TenantService;
  let eventSubscriber: DomainEventSubscriberService;
  let queueService: WorkQueueService<NotificationWorkItem>;
  let verifyService: VerifyService;
  let providers: Providers;
  let repositories: Repositories;

  beforeEach(() => {
    app = {
      use: jest.fn(),
    } as unknown as Application;

    serviceId = {} as AdspId;
    logger = { info: jest.fn() } as unknown as Logger;
    tokenProvider = {} as TokenProvider;
    configurationService = {} as ConfigurationService;
    directory = {} as ServiceDirectory;
    eventService = {} as EventService;
    tenantService = {} as TenantService;
    eventSubscriber = {
      getItems: jest.fn().mockReturnValue([]),
    } as unknown as DomainEventSubscriberService;
    queueService = {} as WorkQueueService<NotificationWorkItem>;
    verifyService = {} as VerifyService;
    providers = {} as Providers;
    repositories = {
      isConnected: jest.fn().mockReturnValue(true),
      subscriptionRepository: {} as SubscriptionRepository,
    };

    (createJobs as jest.Mock).mockClear();
    (createSubscriptionRouter as jest.Mock).mockClear();
  });

  it('should create jobs with the correct parameters', () => {
    applyNotificationMiddleware(app as Application, {
      serviceId,
      logger,
      tokenProvider,
      configurationService,
      directory,
      eventService,
      tenantService,
      eventSubscriber,
      queueService,
      verifyService,
      providers,
      isConnected: repositories.isConnected,
      subscriptionRepository: repositories.subscriptionRepository,
    });

    expect(createJobs).toHaveBeenCalledWith({
      serviceId,
      logger,
      tokenProvider,
      configurationService,
      directory,
      eventService,
      tenantService,
      events: [],
      queueService,
      subscriptionRepository: repositories.subscriptionRepository,
      providers,
    });
  });

  it('should create and use subscription router with the correct path and middleware', () => {
    const subscriptionRouter = {};
    (createSubscriptionRouter as jest.Mock).mockReturnValue(subscriptionRouter);

    applyNotificationMiddleware(app as Application, {
      serviceId,
      logger,
      tokenProvider,
      configurationService,
      directory,
      eventService,
      tenantService,
      eventSubscriber,
      queueService,
      verifyService,
      providers,
      isConnected: repositories.isConnected,
      subscriptionRepository: repositories.subscriptionRepository,
    });

    expect(createSubscriptionRouter).toHaveBeenCalledWith({
      serviceId,
      logger,
      subscriptionRepository: repositories.subscriptionRepository,
      eventService,
      verifyService,
      tenantService,
    });
    expect(app.use).toHaveBeenCalledWith('/subscription/v1', assertAuthenticatedHandler, subscriptionRouter);
  });

  it('should return the application instance', () => {
    const result = applyNotificationMiddleware(app as Application, {
      serviceId,
      logger,
      tokenProvider,
      configurationService,
      directory,
      eventService,
      tenantService,
      eventSubscriber,
      queueService,
      verifyService,
      providers,
      isConnected: repositories.isConnected,
      subscriptionRepository: repositories.subscriptionRepository,
    });

    expect(result).toBe(app);
  });
});
