import { adspId, ConfigurationService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { Subject } from 'rxjs';
import type { Logger } from 'winston';
import { DomainEventWorkItem } from '@core-services/core-common';
import { createJobs } from './index';
import * as logEventModule from './logEvent';

describe('createJobs', () => {
  const serviceId = adspId`urn:ads:platform:event-service`;
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tokenProvider: TokenProvider = {
    getAccessToken: jest.fn(),
  };

  const configurationService = {
    getConfiguration: jest.fn(() => Promise.resolve({})),
    getServiceConfiguration: jest.fn(),
  } as unknown as ConfigurationService;

  const directory: ServiceDirectory = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can create jobs and subscribe to events', async () => {
    const events = new Subject<DomainEventWorkItem>();
    const valueServiceUrl = new URL('http://value-service');

    (directory.getServiceUrl as jest.Mock).mockResolvedValueOnce(valueServiceUrl);

    const logEventJobMock = jest.fn();
    jest.spyOn(logEventModule, 'createLogEventJob').mockReturnValue(logEventJobMock);

    await createJobs({
      serviceId,
      logger,
      directory,
      tokenProvider,
      configurationService,
      events,
    });

    expect(directory.getServiceUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        service: 'value-service',
        api: 'v1',
      })
    );
    expect(logEventModule.createLogEventJob).toHaveBeenCalledWith({
      serviceId,
      logger,
      valueServiceUrl,
      tokenProvider,
      configurationService,
    });

    // Emit an event and verify the job is called
    const done = jest.fn();
    const event = {
      namespace: 'test',
      name: 'test-started',
      timestamp: new Date(),
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      correlationId: 'test-123',
      payload: {},
    };

    events.next({ item: event, done, retryOnError: false });

    expect(logEventJobMock).toHaveBeenCalledWith(event, done);
  });

  it('can handle error when directory.getServiceUrl fails', async () => {
    const events = new Subject<DomainEventWorkItem>();
    const error = new Error('Failed to get service URL');

    (directory.getServiceUrl as jest.Mock).mockRejectedValueOnce(error);

    await createJobs({
      serviceId,
      logger,
      directory,
      tokenProvider,
      configurationService,
      events,
    });

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error encountered in creation of event jobs'),
      expect.objectContaining({ context: 'EventJobs' })
    );
  });

  it('can handle error when createLogEventJob throws', async () => {
    const events = new Subject<DomainEventWorkItem>();
    const valueServiceUrl = new URL('http://value-service');
    const error = new Error('Failed to create log event job');

    (directory.getServiceUrl as jest.Mock).mockResolvedValueOnce(valueServiceUrl);
    jest.spyOn(logEventModule, 'createLogEventJob').mockImplementation(() => {
      throw error;
    });

    await createJobs({
      serviceId,
      logger,
      directory,
      tokenProvider,
      configurationService,
      events,
    });

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error encountered in creation of event jobs'),
      expect.objectContaining({ context: 'EventJobs' })
    );
  });
});
