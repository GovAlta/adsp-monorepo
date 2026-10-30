import axios from 'axios';
import { createValueServiceClient, splitMetricWindows, splitMonths } from './value';

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

  it('follows metric pages until next is absent', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          page: { size: 1, next: 'cursor-2' },
          'pdf-service:pdf-generated:count': {
            name: 'pdf-service:pdf-generated:count',
            values: [{ sum: '4' }],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          page: { size: 1 },
          'pdf-service:pdf-generated:count': {
            name: 'pdf-service:pdf-generated:count',
            values: [{ sum: '6' }],
          },
        },
      });
    const client = createValueServiceClient({
      directory,
      valueServiceUrl: 'https://value-service.example/value/v1',
    });

    const metrics = await client.readEventMetrics('Bearer t', 'pdf-service', '2026-09-15', '2026-09-16');

    expect(metrics['pdf-service:pdf-generated:count'].values.map((row) => row.sum)).toEqual(['4', '6']);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://value-service.example/value/v1/event-service/values/event/metrics',
      expect.objectContaining({
        params: expect.objectContaining({ after: 'cursor-2' }),
      })
    );
  });

  it('stops when value-service repeats a metric cursor', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        page: { size: 1, next: 'again' },
        'pdf-service:pdf-generated:count': {
          name: 'pdf-service:pdf-generated:count',
          values: [{ sum: '1' }],
        },
      },
    });
    const client = createValueServiceClient({
      directory,
      valueServiceUrl: 'https://value-service.example/value/v1',
    });

    const metrics = await client.readEventMetrics('Bearer t', 'pdf-service', '2026-09-15', '2026-09-16');

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(metrics['pdf-service:pdf-generated:count'].values).toHaveLength(2);
  });

  it('reads each metric window with an exclusive next-midnight max and merges them oldest first', async () => {
    mockedAxios.get.mockImplementation(async (_url, config: { params: Record<string, string> }) => {
      const { intervalMin } = JSON.parse(config.params.criteria);
      return {
        data: {
          page: { size: 1 },
          'pdf-service:pdf-generated:count': {
            name: 'pdf-service:pdf-generated:count',
            values: [{ interval: intervalMin, sum: '1' }],
          },
        },
      };
    });
    const client = createValueServiceClient({
      directory,
      valueServiceUrl: 'https://value-service.example/value/v1',
    });

    const metrics = await client.readEventMetrics('Bearer t', 'pdf-service', '2026-08-18', '2026-10-28');

    const requested = mockedAxios.get.mock.calls.map(([, config]: [string, { params: Record<string, string> }]) => ({
      interval: config.params.interval,
      ...JSON.parse(config.params.criteria),
    }));
    expect(requested).toEqual([
      {
        interval: 'daily',
        metricLike: 'pdf-service',
        intervalMin: '2026-08-18T00:00:00.000Z',
        intervalMax: '2026-09-01T00:00:00.000Z',
      },
      {
        interval: 'monthly',
        metricLike: 'pdf-service',
        intervalMin: '2026-09-01T00:00:00.000Z',
        intervalMax: '2026-10-01T00:00:00.000Z',
      },
      {
        interval: 'daily',
        metricLike: 'pdf-service',
        intervalMin: '2026-10-01T00:00:00.000Z',
        intervalMax: '2026-10-27T00:00:00.000Z',
      },
      {
        interval: 'daily',
        metricLike: 'pdf-service',
        intervalMin: '2026-10-27T00:00:00.000Z',
        intervalMax: '2026-10-29T00:00:00.000Z',
      },
    ]);
    expect(metrics['pdf-service:pdf-generated:count'].values.map((row) => row.interval)).toEqual([
      '2026-08-18T00:00:00.000Z',
      '2026-09-01T00:00:00.000Z',
      '2026-10-01T00:00:00.000Z',
      '2026-10-27T00:00:00.000Z',
    ]);
  });

  it('resolves value-service through the directory when no URL is configured', async () => {
    directory.getServiceUrl.mockResolvedValue(new URL('https://value-service.directory/value/v1'));
    mockedAxios.get.mockResolvedValue({ data: { page: {} } });
    const client = createValueServiceClient({ directory });

    await expect(client.readEventMetrics('t', 'pdf-service', '2026-09-15', '2026-09-16')).resolves.toEqual({});
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://value-service.directory/value/v1/event-service/values/event/metrics',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer t' }) })
    );
  });

  it('requires a URL when there is no directory', async () => {
    const client = createValueServiceClient({});

    await expect(client.readEventMetrics('t', 'pdf-service', '2026-09-15', '2026-09-16')).rejects.toThrow(
      'VALUE_SERVICE_URL is required'
    );
  });

  it.each([401, 403])('reports a %s from value-service as unauthorized', async (status) => {
    mockedAxios.get.mockRejectedValue({ response: { status } });
    mockedAxios.isAxiosError.mockReturnValue(true);
    const client = createValueServiceClient({ valueServiceUrl: 'https://value-service.example/value/v1' });

    await expect(client.readEventMetrics('t', 'pdf-service', '2026-09-15', '2026-09-16')).rejects.toThrow(
      'Not authorized to read report data.'
    );
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
        '2026-09-01',
        '2026-09-16'
      )
    ).resolves.toBe(3);
  });

  it('reads every event-log page for one event name', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          page: { size: 1, next: 'p2' },
          'event-service': { event: [{ context: { templateId: 'a' } }] },
        },
      })
      .mockResolvedValueOnce({
        data: {
          page: { size: 1 },
          'event-service': { event: [{ context: { templateId: 'b' } }] },
        },
      });

    const client = createValueServiceClient({
      directory,
      valueServiceUrl: 'https://value-service.example/value/v1/',
    });

    await expect(
      client.countDistinctContext(
        't',
        { namespace: 'pdf-service', eventNames: ['pdf-generated'], contextKey: 'templateId' },
        '2026-09-01',
        '2026-09-16'
      )
    ).resolves.toBe(2);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'https://value-service.example/value/v1/event-service/values/event',
      expect.objectContaining({
        params: expect.objectContaining({ after: 'p2' }),
      })
    );
  });

  it('reads the event log a month at a time, 1000 events per page', async () => {
    mockedAxios.get.mockResolvedValue({ data: { page: { size: 0 }, 'event-service': { event: [] } } });
    const client = createValueServiceClient({ valueServiceUrl: 'https://value-service.example/value/v1/' });

    await client.countDistinctContext(
      't',
      { namespace: 'pdf-service', eventNames: ['pdf-generated', 'pdf-generation-failed'], contextKey: 'templateId' },
      '2026-07-15',
      '2026-09-02'
    );

    const ranges = mockedAxios.get.mock.calls.map(([, config]) => {
      const { top, timestampMin, timestampMax, context } = config.params as Record<string, string>;
      return `${JSON.parse(context).name} ${timestampMin} ${timestampMax} ${top}`;
    });
    expect(ranges.sort()).toEqual(
      [
        'pdf-generated 2026-07-15T00:00:00.000Z 2026-08-01T00:00:00.000Z 1000',
        'pdf-generated 2026-08-01T00:00:00.000Z 2026-09-01T00:00:00.000Z 1000',
        'pdf-generated 2026-09-01T00:00:00.000Z 2026-09-03T00:00:00.000Z 1000',
        'pdf-generation-failed 2026-07-15T00:00:00.000Z 2026-08-01T00:00:00.000Z 1000',
        'pdf-generation-failed 2026-08-01T00:00:00.000Z 2026-09-01T00:00:00.000Z 1000',
        'pdf-generation-failed 2026-09-01T00:00:00.000Z 2026-09-03T00:00:00.000Z 1000',
      ].sort()
    );
  });

  it('passes other value-service errors through', async () => {
    const error = new Error('gateway timeout');
    mockedAxios.get.mockRejectedValue(error);
    mockedAxios.isAxiosError.mockReturnValue(false);
    const client = createValueServiceClient({ valueServiceUrl: 'https://value-service.example/value/v1' });

    await expect(client.readEventMetrics('t', 'pdf-service', '2026-09-15', '2026-09-16')).rejects.toBe(error);
  });
});

describe('splitMetricWindows', () => {
  it('keeps a short period in a single daily window', () => {
    expect(splitMetricWindows('2026-10-28', '2026-10-28')).toEqual([
      { interval: 'daily', from: '2026-10-28', to: '2026-10-28' },
    ]);
    expect(splitMetricWindows('2026-10-27', '2026-10-28')).toEqual([
      { interval: 'daily', from: '2026-10-27', to: '2026-10-28' },
    ]);
  });

  it('separates the trailing days from a period inside one month', () => {
    expect(splitMetricWindows('2026-10-05', '2026-10-28')).toEqual([
      { interval: 'daily', from: '2026-10-05', to: '2026-10-26' },
      { interval: 'daily', from: '2026-10-27', to: '2026-10-28' },
    ]);
  });

  it('reads whole months monthly and the partial months either side daily', () => {
    expect(splitMetricWindows('2025-10-29', '2026-10-28')).toEqual([
      { interval: 'daily', from: '2025-10-29', to: '2025-10-31' },
      { interval: 'monthly', from: '2025-11-01', to: '2026-09-30' },
      { interval: 'daily', from: '2026-10-01', to: '2026-10-26' },
      { interval: 'daily', from: '2026-10-27', to: '2026-10-28' },
    ]);
  });

  it('omits empty edge windows when the settled part is month aligned', () => {
    expect(splitMetricWindows('2024-01-01', '2026-11-02')).toEqual([
      { interval: 'monthly', from: '2024-01-01', to: '2026-10-31' },
      { interval: 'daily', from: '2026-11-01', to: '2026-11-02' },
    ]);
  });

  it('handles month and leap-year boundaries', () => {
    expect(splitMetricWindows('2024-02-29', '2024-03-31')).toEqual([
      { interval: 'daily', from: '2024-02-29', to: '2024-03-29' },
      { interval: 'daily', from: '2024-03-30', to: '2024-03-31' },
    ]);
  });
});

describe('splitMonths', () => {
  it('keeps a period inside one month whole', () => {
    expect(splitMonths('2026-09-03', '2026-09-16')).toEqual([{ from: '2026-09-03', to: '2026-09-16' }]);
  });

  it('splits at month boundaries, clipping the first and last month to the period', () => {
    expect(splitMonths('2024-01-20', '2024-03-05')).toEqual([
      { from: '2024-01-20', to: '2024-01-31' },
      { from: '2024-02-01', to: '2024-02-29' },
      { from: '2024-03-01', to: '2024-03-05' },
    ]);
  });

  it('returns nothing for an empty period', () => {
    expect(splitMonths('2026-09-16', '2026-09-15')).toEqual([]);
  });
});
