import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import FormData = require('form-data');
import { Logger } from 'winston';
import { createFileService } from './file';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('file', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  it('can create file service', () => {
    const service = createFileService({
      logger: loggerMock,
      tokenProvider: tokenProviderMock,
      directory: directoryMock,
    });
    expect(service).toBeTruthy();
  });

  it('can upload file', async () => {
    const service = createFileService({
      logger: loggerMock,
      tokenProvider: tokenProviderMock,
      directory: directoryMock,
    });

    const content = Buffer.from([]);
    const file = { id: 'test' };
    directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://file-service'));
    tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
    axiosMock.post.mockResolvedValueOnce({ data: file });
    const result = await service.upload(tenantId, 'job1', 'test.pdf', content);
    expect(result).toBe(file);
    expect(axiosMock.post).toHaveBeenCalledWith(
      'https://file-service/file/v1/files',
      expect.any(FormData),
      expect.any(Object)
    );
  });
});
