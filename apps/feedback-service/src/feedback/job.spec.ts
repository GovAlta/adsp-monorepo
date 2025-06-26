import { AdspId, adspId } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { FeedbackWorkItem, createAnonymizeJob, createFeedbackJobs } from './job';

describe('job', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const piiServiceMock = {
    anonymize: jest.fn(),
  };

  const valueServiceMock = {
    writeValue: jest.fn(),
    readValues: jest.fn(),
  };

  const queueServiceMock = {
    getItems: jest.fn(() => ({ subscribe: jest.fn() })),
  };

  beforeEach(() => {
    piiServiceMock.anonymize.mockReset();
    valueServiceMock.writeValue.mockReset();
  });

  describe('createFeedbackJobs', () => {
    it('can create jobs', () => {
      createFeedbackJobs({
        logger: loggerMock,
        piiService: piiServiceMock,
        valueService: valueServiceMock,
        queueService: queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>,
      });
      expect(queueServiceMock.getItems).toHaveBeenCalled();
    });
  });

  describe('createAnonymizeJob', () => {
    it('can create anonymize job', () => {
      const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock);
      expect(job).toBeTruthy();
    });

    describe('job', () => {
      it('can process feedback', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock);

        const comment = 'This is a comment.';
        const anonymized = 'This is an anonymized comment.';
        const technicalIssue = 'This is a technical issue';
        piiServiceMock.anonymize.mockResolvedValue(anonymized);
        valueServiceMock.writeValue.mockResolvedValueOnce(null);

        const done = jest.fn();
        await job(
          {
            tenantId: tenantId.toString(),
            timestamp: new Date().toISOString(),
            digest: '123',
            feedback: {
              context: { site: 'http://test.org', view: '/' },
              rating: 'bad',
              comment,
              technicalIssue,
            },
          },
          true,
          done
        );

        expect(piiServiceMock.anonymize).toHaveBeenCalledWith(expect.any(AdspId), comment);
        expect(piiServiceMock.anonymize).toHaveBeenCalledWith(expect.any(AdspId), technicalIssue);
        expect(valueServiceMock.writeValue).toHaveBeenCalledWith(
          expect.any(AdspId),
          expect.objectContaining({
            context: expect.objectContaining({ site: 'http://test.org', view: '/' }),
            rating: 'bad',
            comment: anonymized,
            technicalIssue: anonymized,
            timestamp: expect.any(Date),
          })
        );
        expect(done).toHaveBeenCalledWith();
      });

      it('can process feedback without comment', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock);

        const comment = '';
        valueServiceMock.writeValue.mockResolvedValueOnce(null);

        const done = jest.fn();
        await job(
          {
            tenantId: tenantId.toString(),
            timestamp: new Date().toISOString(),
            digest: '123',
            feedback: {
              context: { site: 'http://test.org', view: '/' },
              rating: 'bad',
              comment,
            },
          },
          true,
          done
        );

        expect(piiServiceMock.anonymize).not.toHaveBeenCalled();
        expect(valueServiceMock.writeValue).toHaveBeenCalledWith(
          expect.any(AdspId),
          expect.objectContaining({
            context: expect.objectContaining({ site: 'http://test.org', view: '/' }),
            rating: 'bad',
            comment,
            timestamp: expect.any(Date),
          })
        );
        expect(done).toHaveBeenCalledWith();
      });

      it('can handle error', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock);

        const comment = 'This is a comment.';
        const anonymized = 'This is an anonymized comment.';
        piiServiceMock.anonymize.mockResolvedValue(anonymized);
        valueServiceMock.writeValue.mockRejectedValueOnce(new Error('oh noes!'));

        const done = jest.fn();
        await job(
          {
            tenantId: tenantId.toString(),
            timestamp: new Date().toISOString(),
            digest: '123',
            feedback: {
              context: { site: 'http://test.org', view: '/' },
              rating: 'bad',
              comment,
            },
          },
          true,
          done
        );

        expect(piiServiceMock.anonymize).toHaveBeenCalledWith(expect.any(AdspId), comment);
        expect(valueServiceMock.writeValue).toHaveBeenCalledWith(
          expect.any(AdspId),
          expect.objectContaining({
            context: expect.objectContaining({ site: 'http://test.org', view: '/' }),
            rating: 'bad',
            comment: anonymized,
            timestamp: expect.any(Date),
          })
        );
        expect(done).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });
});
