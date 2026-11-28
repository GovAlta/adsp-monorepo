import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { FileServiceImpl } from './file';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('FileServiceImpl', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const fileId = adspId`urn:ads:platform:file-service:v1:/files/orphaned-file`;
  const logger = { warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const directory = { getResourceUrl: jest.fn(), getServiceUrl: jest.fn() };
  const tokenProvider = { getAccessToken: jest.fn() };
  const service = new FileServiceImpl(logger, directory, tokenProvider);

  beforeEach(() => {
    jest.resetAllMocks();
    directory.getResourceUrl.mockResolvedValue(new URL('https://file-service/files/orphaned-file'));
    tokenProvider.getAccessToken.mockResolvedValue('token');
    axiosMock.isAxiosError.mockReturnValue(false);
  });

  it('returns the File Service deletion result without logging', async () => {
    axiosMock.delete.mockResolvedValue({ data: { deleted: true } });

    const result = await service.delete(tenantId, fileId);

    expect(result).toBe(true);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('preserves a false deletion result from File Service', async () => {
    axiosMock.delete.mockResolvedValue({ data: { deleted: false } });

    const result = await service.delete(tenantId, fileId);

    expect(result).toBe(false);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('treats an HTTP 404 as already deleted without logging', async () => {
    const error = { response: { status: 404 } };
    axiosMock.isAxiosError.mockImplementation((value) => value === error);
    axiosMock.delete.mockRejectedValue(error);

    const result = await service.delete(tenantId, fileId);

    expect(result).toBe(true);
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs an HTTP 500 deletion failure and preserves the return value', async () => {
    const error = { response: { status: 500 } };
    axiosMock.isAxiosError.mockImplementation((value) => value === error);
    axiosMock.delete.mockRejectedValue(error);

    const result = await service.delete(tenantId, fileId);

    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(`Error encountered deleting file ${fileId}`),
      { context: 'FileService', tenant: tenantId.toString() },
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs a network failure even when its message contains 404', async () => {
    axiosMock.delete.mockRejectedValue(new Error('Network failed after 404 ms'));

    const result = await service.delete(tenantId, fileId);

    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
