import axios from 'axios';
import exportFromJSON from 'export-from-json';
import { EXPORT_PAGE_SIZE, exportEventLogEntries, fetchAllEventLogEntries } from './exportEventLog';

jest.mock('axios');
jest.mock('export-from-json');

const mockedAxiosGet = axios.get as jest.Mock;
const mockedExport = exportFromJSON as unknown as jest.Mock;
(mockedExport as unknown as { types: Record<string, string> }).types = { csv: 'csv' };

const baseUrl = 'http://mock-value-service.com';
const token = 'mock-token';

// Raw value-service shape: namespace/name in `context`, event body in `value.payload`.
const entry = (name: string) => ({
  context: { namespace: 'test-service', name },
  timestamp: '2026-01-01T00:00:00.000Z',
  correlationId: `corr-${name}`,
  value: { payload: { value: name } },
});

const pageResponse = (events: ReturnType<typeof entry>[], next?: string) => ({
  data: { 'event-service': { event: events }, page: { next } },
});

describe('exportEventLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllEventLogEntries', () => {
    it('accumulates entries across pages, following page.next until falsy', async () => {
      mockedAxiosGet
        .mockResolvedValueOnce(pageResponse([entry('a')], 'cursor-1'))
        .mockResolvedValueOnce(pageResponse([entry('b')], 'cursor-2'))
        .mockResolvedValueOnce(pageResponse([entry('c')], undefined));

      const entries = await fetchAllEventLogEntries(baseUrl, token, {});

      expect(entries.map((e) => e.name)).toEqual(['a', 'b', 'c']);
      expect(mockedAxiosGet).toHaveBeenCalledTimes(3);
    });

    it('handles a trailing empty page when total is an exact multiple of the page size', async () => {
      mockedAxiosGet
        .mockResolvedValueOnce(pageResponse([entry('a')], 'cursor-1'))
        .mockResolvedValueOnce(pageResponse([], undefined));

      const entries = await fetchAllEventLogEntries(baseUrl, token, {});

      expect(entries.map((e) => e.name)).toEqual(['a']);
      expect(mockedAxiosGet).toHaveBeenCalledTimes(2);
    });

    it('requests the configured export page size and passes the bearer token', async () => {
      mockedAxiosGet.mockResolvedValueOnce(pageResponse([entry('a')], undefined));

      await fetchAllEventLogEntries(baseUrl, token, {});

      const [url, options] = mockedAxiosGet.mock.calls[0];
      expect(url).toContain(`top=${EXPORT_PAGE_SIZE}`);
      expect(options.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('maps criteria to the context, timestamp and correlationId query params', async () => {
      mockedAxiosGet.mockResolvedValueOnce(pageResponse([], undefined));

      await fetchAllEventLogEntries(baseUrl, token, {
        namespace: 'test-service',
        name: 'test-event',
        timestampMin: '2026-01-01T00:00:00.000Z',
        timestampMax: '2026-01-31T00:00:00.000Z',
        correlationId: 'abc',
      });

      const [url] = mockedAxiosGet.mock.calls[0];
      expect(url).toContain(`context=${JSON.stringify({ namespace: 'test-service', name: 'test-event' })}`);
      expect(url).toContain('timestampMin=2026-01-01T00:00:00.000Z');
      expect(url).toContain('timestampMax=2026-01-31T00:00:00.000Z');
      expect(url).toContain('correlationId=abc');
    });

    it('pins the same timestampMax across every page when the criteria leaves it open-ended', async () => {
      mockedAxiosGet
        .mockResolvedValueOnce(pageResponse([entry('a')], 'cursor-1'))
        .mockResolvedValueOnce(pageResponse([entry('b')], undefined));

      await fetchAllEventLogEntries(baseUrl, token, { namespace: 'test-service' });

      const firstMax = new URL(mockedAxiosGet.mock.calls[0][0]).searchParams.get('timestampMax');
      const secondMax = new URL(mockedAxiosGet.mock.calls[1][0]).searchParams.get('timestampMax');
      expect(firstMax).toBeTruthy();
      expect(secondMax).toBe(firstMax);
    });
  });

  describe('exportEventLogEntries', () => {
    it('exports transformed rows as CSV and returns the entry count', async () => {
      mockedAxiosGet.mockResolvedValueOnce(pageResponse([entry('a')], undefined));

      const count = await exportEventLogEntries(baseUrl, token, 'tenant-event-log', {});

      expect(count).toBe(1);
      const call = mockedExport.mock.calls[0][0];
      expect(call.fileName).toBe('tenant-event-log');
      expect(call.exportType).toBe('csv');
      expect(call.data[0]).toEqual({
        timestamp: new Date('2026-01-01T00:00:00.000Z').toLocaleString(),
        namespace: 'test-service',
        name: 'a',
        correlationId: 'corr-a',
        details: JSON.stringify({ value: 'a' }),
      });
    });

    it('still produces a CSV export when there are no entries', async () => {
      mockedAxiosGet.mockResolvedValueOnce(pageResponse([], undefined));

      const count = await exportEventLogEntries(baseUrl, token, 'tenant-event-log', {});

      expect(count).toBe(0);
      expect(mockedExport).toHaveBeenCalledTimes(1);
      expect(mockedExport.mock.calls[0][0].data).toEqual([{}]);
    });
  });
});
