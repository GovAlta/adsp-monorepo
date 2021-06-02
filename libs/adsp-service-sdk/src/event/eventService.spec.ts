import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { EventServiceImpl } from './eventService';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('EventService', () => {
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
    axiosMock.put.mockReset();
    axiosMock.post.mockReset();
  });

  it('can be created', () => {
    const service = new EventServiceImpl(
      logger,
      directoryMock,
      tokenProviderMock,
      adspId`urn:ads:platform:test-service`
    );
    expect(service).toBeTruthy();
  });

  it('can register events', async (done) => {
    const service = new EventServiceImpl(
      logger,
      directoryMock,
      tokenProviderMock,
      adspId`urn:ads:platform:test-service`
    );

    axiosMock.get.mockResolvedValue({ data: { results: [{ id: 'test-123', configOptions: {} }] } });

    await service.register({
      name: 'test-event',
      description: 'signalled when unit testing',
      payloadSchema: {
        type: 'object',
      },
    });

    expect(axiosMock.get).toHaveBeenCalledTimes(1);
    expect(axiosMock.put).toHaveBeenCalledTimes(1);
    expect(axiosMock.put.mock.calls[0][0]).toContain('test-123');
    expect(axiosMock.put.mock.calls[0][1].configOptions).toHaveProperty('test-service');

    done();
  });

  it('can register events with new event service options', async (done) => {
    const service = new EventServiceImpl(
      logger,
      directoryMock,
      tokenProviderMock,
      adspId`urn:ads:platform:test-service`
    );

    axiosMock.get.mockResolvedValue({ data: { results: [] } });

    await service.register({
      name: 'test-event',
      description: 'signalled when unit testing',
      payloadSchema: {
        type: 'object',
      },
    });

    expect(axiosMock.get).toHaveBeenCalledTimes(1);
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    expect(axiosMock.post.mock.calls[0][1].configOptions).toHaveProperty('test-service');

    done();
  });

  it('can send event', async (done) => {
    const service = new EventServiceImpl(
      logger,
      directoryMock,
      tokenProviderMock,
      adspId`urn:ads:platform:test-service`
    );

    axiosMock.get.mockResolvedValue({ data: { results: [{ id: 'test-123', configOptions: {} }] } });

    await service.register({
      name: 'test-event',
      description: 'signalled when unit testing',
      payloadSchema: {
        type: 'object',
      },
    });

    const event = {
      name: 'test-event',
      timestamp: new Date(),
      payload: {},
    };

    await service.send(event);

    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    expect(axiosMock.post.mock.calls[0][1]).toStrictEqual({ ...event, namespace: 'test-service', tenantId: null });

    done();
  });

  it('fails for send of unknown event', async (done) => {
    const service = new EventServiceImpl(
      logger,
      directoryMock,
      tokenProviderMock,
      adspId`urn:ads:platform:test-service`
    );

    await expect(
      service.send({
        name: 'test-event',
        timestamp: new Date(),
        payload: {},
      })
    ).rejects.toThrow(/Event test-service:test-event is not recognized; only registered events can be sent./);

    done();
  });
});
