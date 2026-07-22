import { createFileServiceClient } from './file';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockTokenProvider = {
  getAccessToken: jest.fn().mockResolvedValue('test-token'),
};

const mockDirectory = {
  getServiceUrl: jest.fn().mockResolvedValue(new URL('https://file-service.test/')),
};

const mockTenantId = { toString: () => 'test-tenant-id' };

describe('FileServiceClient getFileTypeInfo', () => {
  const createClient = () =>
    createFileServiceClient({
      logger: mockLogger as never,
      directory: mockDirectory as never,
      tokenProvider: mockTokenProvider as never,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenProvider.getAccessToken.mockResolvedValue('test-token');
    mockDirectory.getServiceUrl.mockResolvedValue(new URL('https://file-service.test/'));
  });

  it('maps an active retention rule with a day count', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        { id: 'assets', name: 'Assets', anonymousRead: true, rules: { retention: { active: true, deleteInDays: 30 } } },
      ],
    });

    const info = await createClient().getFileTypeInfo(mockTenantId as never, 'Assets');

    expect(info).toEqual({ id: 'assets', name: 'Assets', anonymousRead: true, retentionActive: true, retentionDays: 30 });
    const url = mockedAxios.get.mock.calls[0][0] as string;
    expect(url).toContain('file/v1/types');
  });

  it('reports retention as active even when the day count is missing', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [{ id: 'x', name: 'X', anonymousRead: false, rules: { retention: { active: true } } }],
    });

    const info = await createClient().getFileTypeInfo(mockTenantId as never, 'X');

    expect(info?.retentionActive).toBe(true);
    expect(info?.retentionDays).toBeNull();
  });

  it('reports no retention when the rule is inactive', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [{ id: 'x', name: 'X', anonymousRead: false, rules: { retention: { active: false, deleteInDays: 30 } } }],
    });

    const info = await createClient().getFileTypeInfo(mockTenantId as never, 'X');

    expect(info?.retentionActive).toBe(false);
    expect(info?.retentionDays).toBeNull();
  });

  it('returns null for an unknown type name', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ id: 'other', name: 'Other', anonymousRead: false }] });

    const info = await createClient().getFileTypeInfo(mockTenantId as never, 'Missing');

    expect(info).toBeNull();
  });

  it('returns null and warns when the lookup fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('boom'));

    const info = await createClient().getFileTypeInfo(mockTenantId as never, 'X');

    expect(info).toBeNull();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('caches lookups so repeated calls do not refetch the type list', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [{ id: 'x', name: 'X', anonymousRead: true, rules: {} }],
    });
    const client = createClient();

    await client.getFileTypeInfo(mockTenantId as never, 'X');
    await client.getFileTypeInfo(mockTenantId as never, 'X');

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});
