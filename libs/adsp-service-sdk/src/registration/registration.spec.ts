import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { ServiceRegistrarImpl, describeError } from './registration';

// The registration is not retried, so that a failure is reported without waiting for the retries.
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  retry: { execute: (fn: (context: { attempt: number }) => Promise<unknown>) => fn({ attempt: 1 }) },
}));

jest.mock('axios', () => ({
  ...jest.createMockFromModule<typeof import('axios')>('axios'),
  isAxiosError: (err: unknown) => !!(err as { isAxiosError?: boolean })?.isAxiosError,
}));
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('ServiceRegistrar', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.patch.mockReset();
  });

  it('can register events', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test service',
      description: 'This is a test service.',
      events: [
        {
          name: 'test-event',
          description: 'signalled when unit testing',
          payloadSchema: {
            type: 'object',
          },
        },
      ],
    });

    expect(axiosMock.patch).toHaveBeenCalledTimes(1);
    expect(axiosMock.patch.mock.calls[0][0]).toContain('event-service');
    expect(axiosMock.patch.mock.calls[0][1]).toHaveProperty('update.test-service');
  });

  it('can register events with new event service options', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test service',
      description: 'This is a test service.',
      configurationSchema: {},
      configuration: {
        schema: {},
        description: 'This is a description.',
      },
      events: [
        {
          name: 'test-event',
          description: 'signalled when unit testing',
          payloadSchema: {
            type: 'object',
          },
        },
      ],
    });

    expect(axiosMock.patch).toHaveBeenCalledTimes(3);
    expect(axiosMock.patch.mock.calls[2][1]).toHaveProperty('update.test-service');
  });

  it('can register roles', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test service',
      description: 'This is a test service.',
      roles: [
        {
          role: 'tester',
          description: 'For testing.',
        },
        'tester2',
      ],
    });

    expect(axiosMock.patch).toHaveBeenCalledTimes(1);
    expect(axiosMock.patch.mock.calls[0][0]).toContain('tenant-service');
    expect(axiosMock.patch.mock.calls[0][1]).toHaveProperty('update.urn:ads:platform:test-service');
  });

  it('can register notifications', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test service',
      description: 'This is a test service.',
      notifications: [
        {
          name: 'test-notification',
          description: 'notifies of tests',
          publicSubscribe: true,
          subscriberRoles: [],
          events: [],
          channels: [],
          manageSubscribe: false,
        },
      ],
    });

    expect(axiosMock.patch).toHaveBeenCalledTimes(1);
    expect(axiosMock.patch.mock.calls[0][0]).toContain('notification-service');
    expect(axiosMock.patch.mock.calls[0][1]).toHaveProperty('update.test-notification');
  });

  it('can register push streams', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test service',
      description: 'This is a test service.',
      eventStreams: [
        {
          id: 'configuration-updates',
          name: 'Configuration Updates',
          description: 'Provides configuration update events',
          publicSubscribe: false,
          subscriberRoles: [],
          events: [
            {
              namespace: 'configuration-service',
              name: 'configuration-updated',
            },
          ],
        },
      ],
    });

    expect(axiosMock.patch).toHaveBeenCalledTimes(1);
    expect(axiosMock.patch.mock.calls[0][0]).toContain('push-service');
    expect(axiosMock.patch.mock.calls[0][1]).toHaveProperty('update.configuration-updates');
  });

  it('can register file types', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test service',
      description: 'This is a test service.',
      fileTypes: [
        {
          id: 'service-files',
          name: 'Service files',
          anonymousRead: false,
          readRoles: [],
          updateRoles: [],
        },
      ],
    });

    expect(axiosMock.patch).toHaveBeenCalledTimes(1);
    expect(axiosMock.patch.mock.calls[0][0]).toContain('file-service');
    expect(axiosMock.patch.mock.calls[0][1]).toHaveProperty('update.service-files');
  });

  it('can register value definitions', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test service',
      description: 'This is a test service.',
      values: [
        {
          id: 'test-value',
          name: 'Test values',
          description: 'Values for testing.',
          jsonSchema: {},
        },
      ],
    });

    expect(axiosMock.patch).toHaveBeenCalledTimes(1);
    expect(axiosMock.patch.mock.calls[0][0]).toContain('value-service');
    expect(axiosMock.patch.mock.calls[0][1]).toHaveProperty('update.test-service');
  });

  it('can register additional', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });
    const configuration = {};
    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test service',
      description: 'This is a test service.',
      serviceConfigurations: [
        {
          serviceId: adspId`urn:ads:platform:test-service`,
          configuration,
        },
      ],
    });

    expect(axiosMock.patch).toHaveBeenCalledTimes(1);
    expect(axiosMock.patch.mock.calls[0][0]).toContain('test-service');
    expect(axiosMock.patch.mock.calls[0][1]).toMatchObject({ update: configuration });
  });

  it('can log the response of a failed registration', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);
    (logger.error as jest.Mock).mockClear();

    axiosMock.patch.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 400'), {
        isAxiosError: true,
        response: { status: 400, data: { errorMessage: "must have required property 'id'" } },
      })
    );

    await expect(
      registrar.register({
        serviceId: adspId`urn:ads:platform:test-service`,
        displayName: 'Test service',
        description: 'This is a test service.',
        serviceConfigurations: [{ serviceId: adspId`urn:ads:platform:test-service`, configuration: {} }],
      })
    ).rejects.toThrow('status code 400');

    const message = (logger.error as jest.Mock).mock.calls[0][0];
    expect(message).toContain('urn:ads:platform:test-service');
    expect(message).toContain("must have required property 'id'");
  });

  describe('describeError', () => {
    it('can describe an error without a response', () => {
      expect(describeError(new Error('failed'))).toBe('Error: failed');
    });

    it('can describe an error with a text response', () => {
      const err = Object.assign(new Error('failed'), { isAxiosError: true, response: { data: 'Bad input' } });
      expect(describeError(err)).toBe('Error: failed Response: Bad input');
    });

    it('can truncate a long response', () => {
      const err = Object.assign(new Error('failed'), { isAxiosError: true, response: { data: 'x'.repeat(2000) } });
      expect(describeError(err).length).toBeLessThan(1100);
      expect(describeError(err)).toMatch(/\.\.\.$/);
    });
  });
});
