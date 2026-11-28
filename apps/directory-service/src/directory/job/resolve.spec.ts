import { adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { createResolveJob } from './resolve';

describe('resolve', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const apiId = adspId`urn:ads:platform:directory-service:resource-v1`;

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can create job', () => {
    const job = createResolveJob({
      apiId,
      logger,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
    });
    expect(job).toBeTruthy();
  });

  it('can resolve resource', async () => {
    const resourceId = adspId`urn:ads:platform:test-service:v1:/tests/123`;
    const done = jest.fn();

    const getResourceType = jest.fn();
    const type = {
      type: 'test',
      resolve: jest.fn(),
    };
    getResourceType.mockReturnValueOnce(type);
    type.resolve.mockResolvedValueOnce({
      name: 'Test 123',
      description: 'This is test 123',
    });
    configurationServiceMock.getServiceConfiguration.mockResolvedValueOnce({ getResourceType });

    const job = createResolveJob({
      apiId,
      logger,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
    });
    await job(tenantId, resourceId, true, done);
    expect(done).toHaveBeenCalledWith();
  });

  it('can skip resolve resource not matched to type', async () => {
    const resourceId = adspId`urn:ads:platform:test-service:v1:/tests/123`;
    const done = jest.fn();

    const getResourceType = jest.fn();
    getResourceType.mockReturnValueOnce(null);
    configurationServiceMock.getServiceConfiguration.mockResolvedValueOnce({ getResourceType });

    const job = createResolveJob({
      apiId,
      logger,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
    });
    await job(tenantId, resourceId, true, done);
    expect(done).toHaveBeenCalledWith();
  });

  it('returns a first-attempt error for retry without logging an error', async () => {
    const resourceId = adspId`urn:ads:platform:test-service:v1:/tests/123`;
    const done = jest.fn();

    const getResourceType = jest.fn();
    const type = {
      type: 'test',
      resolve: jest.fn(),
    };
    getResourceType.mockReturnValueOnce(type);
    const resolveError = new Error('oh noes!');
    type.resolve.mockRejectedValueOnce(resolveError);
    configurationServiceMock.getServiceConfiguration.mockResolvedValueOnce({ getResourceType });

    const job = createResolveJob({
      apiId,
      logger,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
    });
    await job(tenantId, resourceId, true, done);
    expect(done).toHaveBeenCalledWith(resolveError);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(eventServiceMock.send).not.toHaveBeenCalled();
  });

  it('logs a contextual warning and sends the failure event on a redelivered error', async () => {
    const resourceId = adspId`urn:ads:platform:test-service:v1:/tests/123`;
    const done = jest.fn();

    const getResourceType = jest.fn();
    const type = {
      type: 'test',
      resolve: jest.fn(),
    };
    getResourceType.mockReturnValueOnce(type);
    const resolveError = new Error('oh noes!');
    type.resolve.mockRejectedValueOnce(resolveError);
    configurationServiceMock.getServiceConfiguration.mockResolvedValueOnce({ getResourceType });

    const job = createResolveJob({
      apiId,
      logger,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
    });
    await job(tenantId, resourceId, false, done);
    expect(eventServiceMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId, name: 'resource-resolution-failed' }),
    );
    expect(done).toHaveBeenCalledWith(resolveError);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(`Error encountered resolving resource ${resourceId}: ${resolveError}`, {
      context: 'ResolveJob',
      tenant: tenantId.toString(),
    });
    expect(logger.error).not.toHaveBeenCalled();
  });
});
