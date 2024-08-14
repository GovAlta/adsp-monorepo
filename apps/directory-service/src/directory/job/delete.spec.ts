import { DomainEvent } from '@core-services/core-common';
import { adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { createDeleteJob } from './delete';

describe('delete', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
  };

  beforeEach(() => {
    configurationServiceMock.getServiceConfiguration.mockClear();
  });

  it('can create delete job', () => {
    const job = createDeleteJob({ logger, configurationService: configurationServiceMock });
    expect(job).toBeTruthy();
  });

  it('can process delete event', async () => {
    const done = jest.fn();

    const event = {
      namespace: 'test-service',
      name: 'test-started',
      tenantId,
      payload: {
        test: {
          id: 'urn:ads:platform:test-service:v1:/tests/123',
        },
      },
    };

    const processDeleteEvent = jest.fn();
    processDeleteEvent.mockResolvedValueOnce(true);
    const getResourceTypeForDeleteEvent = jest.fn();
    getResourceTypeForDeleteEvent.mockReturnValueOnce({ processDeleteEvent });
    configurationServiceMock.getServiceConfiguration.mockResolvedValueOnce({ getResourceTypeForDeleteEvent });

    const job = createDeleteJob({ logger, configurationService: configurationServiceMock });
    await job(event as unknown as DomainEvent, done);

    expect(done).toHaveBeenCalledWith();
  });

  it('can process event not matched to type', async () => {
    const done = jest.fn();

    const event = {
      namespace: 'test-service',
      name: 'test-started',
      tenantId,
      payload: {
        test: {
          id: 'urn:ads:platform:test-service:v1:/tests/123',
        },
      },
    };

    const getResourceTypeForDeleteEvent = jest.fn();
    getResourceTypeForDeleteEvent.mockReturnValueOnce(null);
    configurationServiceMock.getServiceConfiguration.mockResolvedValueOnce({ getResourceTypeForDeleteEvent });

    const job = createDeleteJob({ logger, configurationService: configurationServiceMock });
    await job(event as unknown as DomainEvent, done);

    expect(done).toHaveBeenCalledWith();
  });

  it('can handle job error', async () => {
    const done = jest.fn();

    const event = {
      namespace: 'test-service',
      name: 'test-started',
      tenantId,
      payload: {
        test: {
          id: 'urn:ads:platform:test-service:v1:/tests/123',
        },
      },
    };

    const processDeleteEvent = jest.fn();
    processDeleteEvent.mockRejectedValueOnce(new Error('oh noes!'));
    const getResourceTypeForDeleteEvent = jest.fn();
    getResourceTypeForDeleteEvent.mockReturnValueOnce({ processDeleteEvent });
    configurationServiceMock.getServiceConfiguration.mockResolvedValueOnce({ getResourceTypeForDeleteEvent });

    const job = createDeleteJob({ logger, configurationService: configurationServiceMock });
    await job(event as unknown as DomainEvent, done);

    expect(done).toHaveBeenCalledWith(expect.any(Error));
  });
});
