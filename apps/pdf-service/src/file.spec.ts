import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import FormData = require('form-data');
import { Logger } from 'winston';
import { createFileService } from './file';
import { GENERATED_PDF } from './pdf';

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

  beforeEach(() => {
    directoryMock.getServiceUrl.mockReset();
    tokenProviderMock.getAccessToken.mockReset();
    axiosMock.post.mockReset();
    axiosMock.get.mockReset();
  });

  it('can create file service', () => {
    const service = createFileService({
      logger: loggerMock,
      tokenProvider: tokenProviderMock,
      directory: directoryMock,
    });
    expect(service).toBeTruthy();
  });

  describe('typeExists', () => {
    it('can check type exists', async () => {
      const service = createFileService({
        logger: loggerMock,
        tokenProvider: tokenProviderMock,
        directory: directoryMock,
      });
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://file-service'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      axiosMock.get.mockResolvedValueOnce({ data: { id: 'my-test-type' } });
      const exists = await service.typeExists(tenantId, 'my-test-type');
      expect(exists).toBe(true);
    });

    it('can return false for error', async () => {
      const service = createFileService({
        logger: loggerMock,
        tokenProvider: tokenProviderMock,
        directory: directoryMock,
      });
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('https://file-service'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      axiosMock.get.mockRejectedValueOnce(new Error('oh noes!'));
      const exists = await service.typeExists(tenantId, 'my-test-type');
      expect(exists).toBe(false);
    });
  });

  describe('upload', () => {
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
      const result = await service.upload(tenantId, GENERATED_PDF, 'my-domain-record-1', 'test.pdf', content);
      expect(result).toBe(file);
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://file-service/file/v1/files',
        expect.any(FormData),
        expect.any(Object)
      );
    });
  });
});
