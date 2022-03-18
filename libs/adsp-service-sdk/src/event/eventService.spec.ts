import axios from 'axios';
import { Logger } from 'winston';
import { adspId } from '../utils';
import { EventServiceImpl } from './eventService';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('EventService', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
    getResourceUrl: jest.fn(),
    getMetadataByNamespaces: jest.fn(),
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
      adspId`urn:ads:platform:test-service`,
      []
    );
    expect(service).toBeTruthy();
  });

  it('can send event', async () => {
    const service = new EventServiceImpl(
      logger,
      directoryMock,
      tokenProviderMock,
      adspId`urn:ads:platform:test-service`,
      [
        {
          name: 'test-event',
          description: 'signalled when unit testing',
          payloadSchema: {
            type: 'object',
          },
        },
      ]
    );

    axiosMock.get.mockResolvedValue({ data: { results: [{ id: 'test-123', configOptions: {} }] } });

    const event = {
      tenantId,
      name: 'test-event',
      timestamp: new Date(),
      payload: {},
    };

    await service.send(event);

    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    expect(axiosMock.post.mock.calls[0][1]).toStrictEqual({
      ...event,
      namespace: 'test-service',
      tenantId: tenantId.toString(),
    });
  });

  it('fails for send of unknown event', async () => {
    const service = new EventServiceImpl(
      logger,
      directoryMock,
      tokenProviderMock,
      adspId`urn:ads:platform:test-service`,
      []
    );

    await expect(
      service.send({
        tenantId,
        name: 'test-event',
        timestamp: new Date(),
        payload: {},
      })
    ).rejects.toThrow(/Event test-service:test-event is not recognized; only registered events can be sent./);
  });
});
