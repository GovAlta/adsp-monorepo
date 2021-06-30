import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { ServiceRegistrarImpl } from './registration';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('ServiceRegistrar', () => {
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.put.mockReset();
  });

  it('can register service', async (done) => {
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

    done();
  });

  it('can register events', async (done) => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.post.mockResolvedValue({ data: {} });
    axiosMock.get.mockResolvedValue({ data: { results: [{ id: 'test-123', configOptions: {} }] } });

    await registrar.register({
      serviceId: adspId`urn:ads:platform:test-service`,
      displayName: 'Test Service',
      description: 'This is a test service.',
      configurationSchema: {},
      roles: ['test-admin'],
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

    expect(axiosMock.get).toHaveBeenCalledTimes(1);
    expect(axiosMock.put).toHaveBeenCalledTimes(1);
    expect(axiosMock.put.mock.calls[0][0]).toContain('test-123');
    expect(axiosMock.put.mock.calls[0][1].configOptions).toHaveProperty('test-service');

    done();
  });

  it('can register events with new event service options', async (done) => {
    const registrar = new ServiceRegistrarImpl(logger, directoryMock, tokenProviderMock);

    axiosMock.post.mockResolvedValue({ data: {} });
    axiosMock.get.mockResolvedValue({ data: { results: [] } });

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

    expect(axiosMock.get).toHaveBeenCalledTimes(1);
    expect(axiosMock.post).toHaveBeenCalledTimes(2);
    expect(axiosMock.post.mock.calls[1][1].configOptions).toHaveProperty('test-service');

    done();
  });
});
