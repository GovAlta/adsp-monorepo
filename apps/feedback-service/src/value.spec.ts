import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { createValueService } from './value';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('value', () => {
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

  describe('createValueService', () => {
    beforeEach(() => {
      axiosMock.post.mockReset();
    });

    it('can create service', () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });
      expect(service).toBeTruthy();
    });
  });

  describe('ValueService', () => {
    it('can write value', async () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });

      const feedbackValue = {
        timestamp: new Date(),
        context: {
          site: 'http://test.org',
          view: '/',
          correlationId: 'this is a value.',
        },
        digest: '123',
        rating: 'good',
        comment: 'This is ok.',
      };
      axiosMock.post.mockResolvedValueOnce({ data: undefined });
      await service.writeValue(tenantId, feedbackValue);
      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/feedback-service/values/feedback'),
        expect.objectContaining({
          timestamp: feedbackValue.timestamp,
          correlationId: feedbackValue.context.correlationId,
          context: expect.objectContaining(feedbackValue.context),
          value: expect.objectContaining({ rating: feedbackValue.rating, comment: feedbackValue.comment }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        })
      );
    });

    it('can write value without correlationId', async () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });

      const feedbackValue = {
        timestamp: new Date(),
        context: {
          site: 'http://test.org',
          view: '/',
        },
        digest: '123',
        rating: 'good',
        comment: 'This is ok.',
      };
      axiosMock.post.mockResolvedValueOnce({ data: undefined });
      await service.writeValue(tenantId, feedbackValue);
      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/feedback-service/values/feedback'),
        expect.objectContaining({
          timestamp: feedbackValue.timestamp,
          correlationId: `${feedbackValue.context.site}:${feedbackValue.context.view}`,
          context: expect.objectContaining(feedbackValue.context),
          value: expect.objectContaining({ rating: feedbackValue.rating, comment: feedbackValue.comment }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        })
      );
    });

    it('can fail for request error', async () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });

      const feedbackValue = {
        timestamp: new Date(),
        context: {
          site: 'http://test.org',
          view: '/',
          correlationId: 'this is a value.',
        },
        digest: '123',
        rating: 'good',
        comment: 'This is ok.',
      };
      axiosMock.post.mockRejectedValueOnce(new Error('oh noes!'));
      await expect(service.writeValue(tenantId, feedbackValue)).rejects.toThrow(Error);
    });
  });
});
