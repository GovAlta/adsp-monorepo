import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { createPiiService } from './pii';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('pii', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('http://totally-real-directory'))),
    getResourceUrl: jest.fn(),
  };

  describe('createPiiService', () => {
    beforeEach(() => {
      axiosMock.post.mockReset();
    });

    it('can create service', () => {
      const service = createPiiService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });
      expect(service).toBeTruthy();
    });
  });

  describe('PiiService', () => {
    it('can anonymize', async () => {
      const service = createPiiService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });

      const original = 'This is some original value.';
      const anonymized = 'This is the anonymized version.';
      axiosMock.post.mockResolvedValueOnce({ data: { text: anonymized } });
      const result = await service.anonymize(tenantId, original);
      expect(result).toBe(anonymized);
      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/anonymize'),
        expect.objectContaining({ text: original, language: 'en', score_threshold: 0.3 }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        })
      );
    });

    it('can fail for request error', async () => {
      const service = createPiiService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });

      const original = 'This is some original value.';
      axiosMock.post.mockRejectedValueOnce(new Error('oh noes!'));
      await expect(service.anonymize(tenantId, original)).rejects.toThrow(Error);
    });
  });
});
