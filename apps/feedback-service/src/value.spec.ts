import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';
import { createValueService } from './value';
import { FeedbackEntry, Rating, ValueResponse } from './feedback';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('Value Service', () => {
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

  beforeEach(() => {
    axiosMock.post.mockReset();
    axiosMock.get.mockReset();
  });

  const getFeedbackEntries = (site: string = 'http://test.org') => {
    return [
      {
        timestamp: '2025-06-27T17:12:02.893Z',
        correlationId: 'this is a value.',
        context: {
          site: site,
          view: '/',
          digest: '123',
          includesComment: true,
          includesTechnicalIssue: false,
        },
        value: {
          rating: 'yuck',
          ratingValue: 0,
          comment: 'This is bad.',
          technicalIssue: 'This is broken',
        },
      },
    ] as FeedbackEntry[];
  };

  const getNextPage = (size: number = 1) => {
    return {
      size: size,
      next: 'MTA=',
      after: 'MM3=',
    };
  };

  const getFeedbackValue = (site: string = 'http://test.org') => {
    return {
      'feedback-service': {
        feedback: getFeedbackEntries(site),
      },
      page: getNextPage(),
    } as ValueResponse;
  };

  describe('createValueService', () => {
    it('can create service', () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });
      expect(service).toBeTruthy();
    });
  });

  describe('Write values', () => {
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
        technicalIssue: 'This is broken',
      };
      axiosMock.post.mockResolvedValueOnce({ data: undefined });
      await service.writeValue(tenantId, feedbackValue);
      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/feedback-service/values/feedback'),
        expect.objectContaining({
          timestamp: feedbackValue.timestamp,
          correlationId: feedbackValue.context.correlationId,
          context: expect.objectContaining(feedbackValue.context),
          value: expect.objectContaining({
            rating: feedbackValue.rating,
            ratingValue: Rating[feedbackValue.rating],
            comment: feedbackValue.comment,
            technicalIssue: feedbackValue.technicalIssue,
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        }),
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
          correlationId: `${feedbackValue.context.site}${feedbackValue.context.view}`,
          context: expect.objectContaining(feedbackValue.context),
          value: expect.objectContaining({
            rating: feedbackValue.rating,
            ratingValue: Rating[feedbackValue.rating],
            comment: feedbackValue.comment,
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        }),
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

  describe('Read values', () => {
    it('increments rating value', async () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });

      const expected = getFeedbackValue();
      axiosMock.get.mockResolvedValueOnce({ data: expected });
      const actual = await service.readValues(tenantId, {
        site: 'http://test.org',
        top: 50,
        start: '2025-05-27T17:12:02.893Z',
        end: '2025-06-27T17:12:02.893Z',
        after: 'MM3=',
      });
      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/feedback-service/values/feedback'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        }),
      );

      const expectedFeedback = expected['feedback-service'].feedback[0];
      expect(actual.feedback[0]).toMatchObject({
        timestamp: expectedFeedback.timestamp,
        correlationId: expectedFeedback.correlationId,
        context: {
          digest: expectedFeedback.context.digest,
          includesComment: expectedFeedback.context.includesComment,
          includesTechnicalIssue: expectedFeedback.context.includesTechnicalIssue,
          site: expectedFeedback.context.site,
          view: expectedFeedback.context.view,
        },
        value: {
          rating: expectedFeedback.value.rating,
          ratingValue: expectedFeedback.value.ratingValue + 1,
          comment: expectedFeedback.value.comment,
          technicalIssue: expectedFeedback.value.technicalIssue,
        },
      });
    });

    it('can fail for request error', async () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });

      axiosMock.get.mockRejectedValueOnce(new Error('oh noes!'));
      await expect(
        service.readValues(tenantId, {
          site: 'http://test.org}',
          top: 10,
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe('Read summary', () => {
    it('aggregates counts and a converted weighted rating across every metric page', async () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });
      axiosMock.get
        .mockResolvedValueOnce({ data: { count: 247 } })
        .mockResolvedValueOnce({ data: { count: 38 } })
        .mockResolvedValueOnce({ data: { count: 21 } })
        .mockResolvedValueOnce({
          data: {
            'http://test.org:rating': { values: [{ sum: '550', count: '200' }] },
            page: { next: 'next-rating-page' },
          },
        })
        .mockResolvedValueOnce({
          data: { 'http://test.org:rating': { values: [{ sum: '141', count: '47' }] }, page: {} },
        });

      const summary = await service.readSummary(tenantId, {
        site: 'http://test.org',
        start: '2025-05-27T00:00:00.000Z',
        end: '2025-06-27T23:59:59.999Z',
      });

      expect(summary).toEqual({
        totalResponses: 247,
        averageRating: 3.8,
        responsesWithComments: 38,
        responsesWithIssues: 21,
      });
      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/feedback-service/values/feedback/count'),
        expect.objectContaining({
          params: expect.objectContaining({
            tenantId: tenantId.toString(),
            context: JSON.stringify({ site: 'http://test.org' }),
            timestampMin: '2025-05-27T00:00:00.000Z',
            timestampMax: '2025-06-27T23:59:59.999Z',
          }),
        }),
      );
      expect(axiosMock.get).toHaveBeenLastCalledWith(
        expect.stringContaining('/metrics'),
        expect.objectContaining({
          params: expect.objectContaining({
            after: 'next-rating-page',
            criteria: expect.stringContaining('http://test.org:rating'),
          }),
        }),
      );
    });

    it('counts comments and issues using the same site and date filters', async () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });
      axiosMock.get
        .mockResolvedValueOnce({ data: { count: 4 } })
        .mockResolvedValueOnce({ data: { count: 3 } })
        .mockResolvedValueOnce({ data: { count: 2 } })
        .mockResolvedValueOnce({
          data: { 'https://service.alberta.ca:rating': { values: [{ sum: '8', count: '4' }] }, page: {} },
        });

      await service.readSummary(tenantId, {
        site: 'https://service.alberta.ca',
        start: '2025-06-01T00:00:00.000Z',
        end: '2025-06-30T23:59:59.999Z',
      });

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('/count'),
        expect.objectContaining({
          params: expect.objectContaining({
            context: JSON.stringify({ site: 'https://service.alberta.ca', includesComment: true }),
            timestampMin: '2025-06-01T00:00:00.000Z',
            timestampMax: '2025-06-30T23:59:59.999Z',
          }),
        }),
      );
      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('/count'),
        expect.objectContaining({
          params: expect.objectContaining({
            context: JSON.stringify({ site: 'https://service.alberta.ca', includesTechnicalIssue: true }),
          }),
        }),
      );
    });

    it('returns an empty summary when no feedback matches', async () => {
      const service = createValueService({
        logger: loggerMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });
      axiosMock.get
        .mockResolvedValueOnce({ data: { count: 0 } })
        .mockResolvedValueOnce({ data: { count: 0 } })
        .mockResolvedValueOnce({ data: { count: 0 } })
        .mockResolvedValueOnce({ data: { 'http://test.org:rating': { values: [] }, page: {} } });

      const summary = await service.readSummary(tenantId, { site: 'http://test.org' });

      expect(summary).toEqual({
        totalResponses: 0,
        averageRating: null,
        responsesWithComments: 0,
        responsesWithIssues: 0,
      });
    });
  });
});
