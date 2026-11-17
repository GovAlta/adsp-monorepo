import { AdspId, AuditService, adspId } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import {
  FeedbackAnonymizationFailedAuditAction,
  FeedbackAnonymizedAuditAction,
  FeedbackJobAuditActor,
  toFeedbackAuditEventId,
} from './audit';
import { FeedbackWorkItem, createAnonymizeJob, createFeedbackJobs } from './job';

describe('job', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const piiServiceMock = {
    anonymize: jest.fn(),
  };

  const valueServiceMock = {
    writeValue: jest.fn(),
    readValues: jest.fn(),
    readSummary: jest.fn(),
  };

  const queueServiceMock = {
    getItems: jest.fn(() => ({ subscribe: jest.fn() })),
  };

  const auditServiceMock = {
    record: jest.fn(),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };
  const auditService = auditServiceMock as unknown as AuditService;

  beforeEach(() => {
    piiServiceMock.anonymize.mockReset();
    valueServiceMock.writeValue.mockReset();
    auditServiceMock.record.mockReset();
  });

  describe('createFeedbackJobs', () => {
    it('can create jobs', () => {
      createFeedbackJobs({
        logger: loggerMock,
        piiService: piiServiceMock,
        valueService: valueServiceMock,
        auditService,
        queueService: queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>,
      });
      expect(queueServiceMock.getItems).toHaveBeenCalled();
    });
  });

  describe('createAnonymizeJob', () => {
    it('can create anonymize job', () => {
      const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);
      expect(job).toBeTruthy();
    });

    describe('job', () => {
      it('can process feedback', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);

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
          done,
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
          }),
        );
        expect(done).toHaveBeenCalledWith();
      });

      it('can process feedback without comment', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);

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
          done,
        );

        expect(piiServiceMock.anonymize).not.toHaveBeenCalled();
        expect(valueServiceMock.writeValue).toHaveBeenCalledWith(
          expect.any(AdspId),
          expect.objectContaining({
            context: expect.objectContaining({ site: 'http://test.org', view: '/' }),
            rating: 'bad',
            comment,
            timestamp: expect.any(Date),
          }),
        );
        expect(done).toHaveBeenCalledWith();
      });

      it('can handle error', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);

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
          done,
        );

        expect(piiServiceMock.anonymize).toHaveBeenCalledWith(expect.any(AdspId), comment);
        expect(valueServiceMock.writeValue).toHaveBeenCalledWith(
          expect.any(AdspId),
          expect.objectContaining({
            context: expect.objectContaining({ site: 'http://test.org', view: '/' }),
            rating: 'bad',
            comment: anonymized,
            timestamp: expect.any(Date),
          }),
        );
        expect(done).toHaveBeenCalledWith(expect.any(Error));
        expect(auditServiceMock.record).not.toHaveBeenCalled();
      });
    });

    describe('audit', () => {
      const feedbackId = '0b6f6f1d-7c1a-4d8a-9d7e-2f0f4f4b8a11';
      const comment = 'My name is Jane Doe.';
      const technicalIssue = 'Call me at 780-555-0100.';
      const item = (feedback: Partial<FeedbackWorkItem['feedback']> = {}, id: string = feedbackId) => ({
        id,
        tenantId: tenantId.toString(),
        timestamp: new Date().toISOString(),
        digest: '123',
        feedback: {
          context: { site: 'http://test.org', view: '/apply', correlationId: 'application-1' },
          rating: 'bad',
          ...feedback,
        },
      });

      it('records anonymized feedback without the text', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);
        piiServiceMock.anonymize.mockResolvedValue('My name is <PERSON>.');
        valueServiceMock.writeValue.mockResolvedValueOnce(null);

        const done = jest.fn();
        await job(item({ comment, technicalIssue }), true, done);

        expect(done).toHaveBeenCalledWith();
        expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
        expect(auditServiceMock.record).toHaveBeenCalledWith(FeedbackAnonymizedAuditAction, {
          tenantId: expect.objectContaining({ resource: tenantId.resource }),
          actor: FeedbackJobAuditActor,
          resource: { type: 'feedback', id: feedbackId },
          correlationId: 'application-1',
          eventId: toFeedbackAuditEventId(FeedbackAnonymizedAuditAction, feedbackId),
          metadata: {
            site: 'http://test.org',
            view: '/apply',
            rating: 'bad',
            commentProvided: true,
            technicalIssueProvided: true,
          },
        });
        const recorded = JSON.stringify(auditServiceMock.record.mock.calls);
        expect(recorded).not.toContain(comment);
        expect(recorded).not.toContain(technicalIssue);
        expect(recorded).not.toContain('<PERSON>');
      });

      it('does not record anonymized for feedback without text', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);
        valueServiceMock.writeValue.mockResolvedValueOnce(null);

        const done = jest.fn();
        await job(item(), true, done);

        expect(done).toHaveBeenCalledWith();
        expect(auditServiceMock.record).not.toHaveBeenCalled();
      });

      it('identifies feedback queued without an id', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);
        piiServiceMock.anonymize.mockResolvedValue('anonymized');
        valueServiceMock.writeValue.mockResolvedValueOnce(null);

        const done = jest.fn();
        await job(item({ comment }, undefined), true, done);

        expect(done).toHaveBeenCalledWith();
        expect(auditServiceMock.record).toHaveBeenCalledWith(
          FeedbackAnonymizedAuditAction,
          expect.objectContaining({
            resource: { type: 'feedback', id: expect.stringMatching(/^[0-9a-f-]{36}$/) },
          }),
        );
      });

      it('does not record a failed anonymization that will be retried', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);
        piiServiceMock.anonymize.mockRejectedValueOnce(new Error('Request failed with status code 503'));

        const done = jest.fn();
        await job(item({ comment }), true, done);

        expect(done).toHaveBeenCalledWith(expect.any(Error));
        expect(valueServiceMock.writeValue).not.toHaveBeenCalled();
        expect(auditServiceMock.record).not.toHaveBeenCalled();
      });

      it('records a failed anonymization on the final attempt', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);
        piiServiceMock.anonymize.mockRejectedValueOnce(new Error('Request failed with status code 503'));

        const done = jest.fn();
        await job(item({ comment, technicalIssue }), false, done);

        expect(done).toHaveBeenCalledWith(expect.any(Error));
        expect(valueServiceMock.writeValue).not.toHaveBeenCalled();
        expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
        expect(auditServiceMock.record).toHaveBeenCalledWith(FeedbackAnonymizationFailedAuditAction, {
          tenantId: expect.objectContaining({ resource: tenantId.resource }),
          status: 'error',
          actor: FeedbackJobAuditActor,
          resource: { type: 'feedback', id: feedbackId },
          correlationId: 'application-1',
          eventId: toFeedbackAuditEventId(FeedbackAnonymizationFailedAuditAction, feedbackId),
          metadata: {
            site: 'http://test.org',
            view: '/apply',
            rating: 'bad',
            commentProvided: true,
            technicalIssueProvided: true,
            error: 'Request failed with status code 503',
          },
        });
        const recorded = JSON.stringify(auditServiceMock.record.mock.calls);
        expect(recorded).not.toContain(comment);
        expect(recorded).not.toContain(technicalIssue);
      });

      it('does not record anonymization failed when storing the value fails', async () => {
        const job = createAnonymizeJob(loggerMock, piiServiceMock, valueServiceMock, auditService);
        piiServiceMock.anonymize.mockResolvedValue('anonymized');
        valueServiceMock.writeValue.mockRejectedValueOnce(new Error('oh noes!'));

        const done = jest.fn();
        await job(item({ comment }), false, done);

        expect(done).toHaveBeenCalledWith(expect.any(Error));
        expect(auditServiceMock.record).not.toHaveBeenCalled();
      });
    });
  });
});
