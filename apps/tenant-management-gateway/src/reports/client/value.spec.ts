import axios from 'axios';
import { createValueServiceClient } from './value';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('createValueServiceClient', () => {
  const directory = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  beforeEach(() => {
    mockedAxios.get.mockReset();
    directory.getServiceUrl.mockReset();
  });

  it('reads daily event metrics from the v1 base URL', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        page: { size: 1 },
        'pdf-service:pdf-generated:count': { name: 'pdf-service:pdf-generated:count', values: [{ sum: '4' }] },
      },
    });
    const client = createValueServiceClient({
      directory,
      valueServiceUrl: 'https://value-service.example/value/v1',
    });

    const metrics = await client.readEventMetrics('Bearer t', 'pdf-service', '2026-08-18', '2026-09-16');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://value-service.example/value/v1/event-service/values/event/metrics',
      expect.objectContaining({
        params: expect.objectContaining({ interval: 'daily' }),
      })
    );
    expect(metrics['pdf-service:pdf-generated:count'].values[0].sum).toBe('4');
  });

  it('unions distinct context values across event names', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          page: { size: 1 },
          'event-service': { event: [{ context: { templateId: 'a' } }, { context: { templateId: 'b' } }] },
        },
      })
      .mockResolvedValueOnce({
        data: {
          page: { size: 1 },
          'event-service': { event: [{ context: { templateId: 'b' } }, { context: { templateId: 'c' } }] },
        },
      })
      .mockResolvedValueOnce({
        data: { page: { size: 0 }, 'event-service': { event: [] } },
      });

    const client = createValueServiceClient({
      directory,
      valueServiceUrl: 'https://value-service.example/value/v1/',
    });

    await expect(
      client.countDistinctContext(
        't',
        {
          namespace: 'pdf-service',
          eventNames: ['pdf-generation-queued', 'pdf-generated', 'pdf-generation-failed'],
          contextKey: 'templateId',
        },
        '2026-08-18',
        '2026-09-16'
      )
    ).resolves.toBe(3);
  });
});
