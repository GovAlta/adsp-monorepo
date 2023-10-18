import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { ServiceRegistrarImpl } from './registration';

jest.mock('axios');
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
});
