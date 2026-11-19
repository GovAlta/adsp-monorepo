import { adspId, auditDefinitions, AuditService, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  AnonymousAuditActor,
  FeedbackAnonymizationFailedAuditAction,
  FeedbackAnonymizedAuditAction,
  FeedbackAuditActions,
  FeedbackSubmittedAuditAction,
  recordFeedbackAudit,
  toAuditError,
  toFeedbackAuditActor,
  toFeedbackAuditDetails,
  toFeedbackAuditEventId,
} from './audit';

describe('audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = { warn: jest.fn() } as unknown as Logger;

  it('defines the feedback service action catalog', () => {
    expect(auditDefinitions(FeedbackAuditActions)).toEqual({
      'feedback.submitted': expect.objectContaining({
        version: 1,
        category: 'data-access',
        severity: 'info',
        retentionClass: 'standard',
        resourceType: 'feedback',
      }),
      'feedback.anonymized': expect.objectContaining({
        version: 1,
        category: 'runtime',
        severity: 'info',
        retentionClass: 'standard',
        resourceType: 'feedback',
      }),
      'feedback.anonymization-failed': expect.objectContaining({
        version: 1,
        category: 'runtime',
        severity: 'warning',
        retentionClass: 'security',
        resourceType: 'feedback',
      }),
    });
  });

  describe('toFeedbackAuditActor', () => {
    it('converts a user', () => {
      expect(
        toFeedbackAuditActor({ id: 'tester', name: 'Tester', email: 'tester@test.org', roles: ['a'] } as User),
      ).toEqual({ id: 'tester', type: 'user', name: 'Tester', email: 'tester@test.org', roles: ['a'] });
    });

    it('converts a service account', () => {
      expect(toFeedbackAuditActor({ id: 'sa', name: 'service-account-my-app', roles: [] } as User)).toEqual(
        expect.objectContaining({ id: 'sa', type: 'service' }),
      );
    });

    it('uses the anonymous actor without a user', () => {
      expect(toFeedbackAuditActor(undefined)).toBe(AnonymousAuditActor);
      expect(AnonymousAuditActor).toEqual({ id: 'anonymous', type: 'user', name: 'Anonymous' });
    });
  });

  describe('toFeedbackAuditDetails', () => {
    it('records the context and rating, and only whether text was provided', () => {
      const details = toFeedbackAuditDetails(AnonymousAuditActor, tenantId, 'feedback-1', {
        context: { site: 'https://test.org', view: '/apply', correlationId: 'application-1' },
        rating: 'good',
        comment: 'My name is Jane Doe.',
      });

      expect(details).toEqual({
        tenantId,
        actor: AnonymousAuditActor,
        resource: { type: 'feedback', id: 'feedback-1' },
        correlationId: 'application-1',
        metadata: {
          site: 'https://test.org',
          view: '/apply',
          rating: 'good',
          commentProvided: true,
          technicalIssueProvided: false,
        },
      });
    });

    it('omits an empty correlation ID', () => {
      const details = toFeedbackAuditDetails(AnonymousAuditActor, tenantId, 'feedback-1', {
        context: { site: 'https://test.org', view: '/', correlationId: '' },
        rating: 'good',
      });
      expect(details.correlationId).toBeUndefined();
    });
  });

  describe('toFeedbackAuditEventId', () => {
    it('is a stable UUID per action and feedback', () => {
      const id = toFeedbackAuditEventId(FeedbackAnonymizedAuditAction, 'feedback-1');
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(toFeedbackAuditEventId(FeedbackAnonymizedAuditAction, 'feedback-1')).toBe(id);
      expect(toFeedbackAuditEventId(FeedbackAnonymizationFailedAuditAction, 'feedback-1')).not.toBe(id);
      expect(toFeedbackAuditEventId(FeedbackAnonymizedAuditAction, 'feedback-2')).not.toBe(id);
    });
  });

  describe('toAuditError', () => {
    it('describes errors and truncates long messages', () => {
      expect(toAuditError(new Error('oh noes!'))).toBe('oh noes!');
      expect(toAuditError('failed')).toBe('failed');
      expect(toAuditError(new Error('x'.repeat(1000)))).toHaveLength(500);
    });
  });

  describe('recordFeedbackAudit', () => {
    it('records the event', () => {
      const auditService = { record: jest.fn().mockResolvedValue({ status: 'recorded' }) };
      const details = toFeedbackAuditDetails(AnonymousAuditActor, tenantId, 'feedback-1', {
        context: { site: 'https://test.org', view: '/' },
        rating: 'good',
      });

      recordFeedbackAudit(
        auditService as unknown as AuditService,
        loggerMock,
        FeedbackSubmittedAuditAction,
        () => details,
      );
      expect(auditService.record).toHaveBeenCalledWith(FeedbackSubmittedAuditAction, details);
    });

    it('logs instead of throwing when details cannot be created', () => {
      const auditService = { record: jest.fn() };

      expect(() =>
        recordFeedbackAudit(auditService as unknown as AuditService, loggerMock, FeedbackSubmittedAuditAction, () => {
          throw new Error('oh noes!');
        }),
      ).not.toThrow();
      expect(auditService.record).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('feedback.submitted'), expect.any(Object));
    });
  });
});
