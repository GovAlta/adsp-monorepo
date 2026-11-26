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
  });

  it('logs an error and preserves the return value when required file cleanup fails', async () => {
    axiosMock.delete.mockRejectedValue(new Error('File service unavailable'));

    const result = await service.delete(tenantId, fileId);

    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(`Error encountered deleting file ${fileId}`),
      { context: 'FileService', tenant: tenantId.toString() },
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
