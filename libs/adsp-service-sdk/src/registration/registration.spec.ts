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

  it('can register service', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.post.mockResolvedValue({ data: {} });
    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test Service',
      description: 'This is a test service.',
      configurationSchema: {},
    });

    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    expect(axiosMock.post.mock.calls[0][0]).toContain('test-service');
  });

  it('can register events', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test Service',
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
    expect(axiosMock.patch.mock.calls[0][1].update).toHaveProperty('test-service');
  });

  it('can register events with new event service options', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test Service',
      description: 'This is a test service.',
      configurationSchema: {},
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

    expect(axiosMock.patch).toHaveBeenCalledTimes(2);
    expect(axiosMock.patch.mock.calls[1][1].update).toHaveProperty('test-service');
  });

  it('can register notifications', async () => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.patch.mockResolvedValue({ data: {} });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test Service',
      description: 'This is a test service.',
      notifications: [
        {
          name: 'test-notification',
          description: 'notifies of tests',
          publicSubscribe: true,
          subscriberRoles: [],
          events: [],
        },
      ],
    });

    expect(axiosMock.patch).toHaveBeenCalledTimes(1);
    expect(axiosMock.patch.mock.calls[0][0]).toContain('notification-service');
    expect(axiosMock.patch.mock.calls[0][1].update).toHaveProperty('test-notification');
  });
});
