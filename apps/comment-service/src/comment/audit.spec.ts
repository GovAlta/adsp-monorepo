import { adspId, auditDefinitions, resolveRetentionClass } from '@abgov/adsp-service-sdk';
import type { AuditService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  CommentAuditActions,
  TopicCreatedAuditAction,
  recordCommentAudit,
  toCommentAuditDetails,
  toTopicAuditDetails,
  toTopicTypeUpdatedAuditDetails,
  toTopicUpdatedAuditDetails,
} from './audit';

describe('audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = {
    tenantId,
    id: 'user-1',
    name: 'Tester',
    email: 'tester@gov.ab.ca',
    roles: ['commenter'],
    isCore: false,
    token: null,
  };
  const topic = { tenantId, id: 1, name: 'Case 1', resourceId: 'case-1', type: { id: 'case' } };

  it('defines the comment service action catalog', () => {
    expect(auditDefinitions(CommentAuditActions)).toEqual({
      'topic.created': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        resourceType: 'topic',
      }),
      'topic.updated': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        resourceType: 'topic',
        captureChangeSet: true,
      }),
      'topic.deleted': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        resourceType: 'topic',
      }),
      'comment.created': expect.objectContaining({
        category: 'data-access',
        severity: 'info',
        resourceType: 'comment',
      }),
      'comment.updated': expect.objectContaining({
        category: 'data-access',
        severity: 'info',
        resourceType: 'comment',
      }),
      'comment.deleted': expect.objectContaining({
        category: 'data-access',
        severity: 'warning',
        resourceType: 'comment',
      }),
      'topic-type.created': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        resourceType: 'topic-type',
      }),
      'topic-type.updated': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        resourceType: 'topic-type',
        captureChangeSet: true,
      }),
      'topic-type.deleted': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        resourceType: 'topic-type',
      }),
    });
  });

  it('derives the retention class of every action from its category', () => {
    for (const action of CommentAuditActions) {
      expect(action.retentionClass).toBeUndefined();
      expect(resolveRetentionClass(action)).toBe('compliance');
    }
  });

  it('builds topic details without a resource ID', () => {
    expect(toTopicAuditDetails(user, { ...topic, resourceId: undefined, type: undefined })).toEqual({
      tenantId,
      actor: { id: 'user-1', type: 'user', name: 'Tester', email: 'tester@gov.ab.ca', roles: ['commenter'] },
      resource: { type: 'topic', id: '1', name: 'Case 1' },
      correlationId: undefined,
      metadata: { topicId: 1, typeId: null, resourceId: null },
    });
  });

  it('builds comment details from the topic', () => {
    expect(toCommentAuditDetails(user, topic, { id: 2 }, 'deleted', { authorId: 'author-1' })).toEqual(
      expect.objectContaining({
        resource: { type: 'comment', id: '2' },
        correlationId: 'case-1',
        metadata: { topicId: 1, typeId: 'case', resourceId: 'case-1', commentAction: 'deleted', authorId: 'author-1' },
      }),
    );
  });

  it('omits a topic change set over the size limit', () => {
    const commenters = Array.from({ length: 1000 }, (_, i) => `00000000-0000-0000-0000-${`${i}`.padStart(12, '0')}`);
    const details = toTopicUpdatedAuditDetails(
      user,
      { ...topic, description: 'd', commenters },
      { name: 'Case 1', description: 'd', commenters: [] },
    );

    expect(details.changeSet).toBeUndefined();
    expect(details.metadata).toEqual(
      expect.objectContaining({ updatedFields: ['commenters'], changeSetOmitted: true }),
    );
  });

  it('does not add a change set when only the topic description changes', () => {
    const details = toTopicUpdatedAuditDetails(
      user,
      { ...topic, description: 'new', commenters: [] },
      { name: 'Case 1', description: 'old', commenters: [] },
    );

    expect(details.changeSet).toBeUndefined();
    expect(details.metadata.updatedFields).toEqual(['description']);
  });

  it('defaults missing topic type roles in the change set', () => {
    const details = toTopicTypeUpdatedAuditDetails(
      tenantId,
      user,
      { id: 'case', name: 'Case', adminRoles: undefined, readerRoles: [], commenterRoles: [] },
      {
        id: 'case',
        name: 'Case',
        adminRoles: ['admin'],
        readerRoles: [],
        commenterRoles: [],
        securityClassification: 'protected a',
      },
    );

    expect(details.changeSet).toEqual({
      before: { name: 'Case', adminRoles: [], readerRoles: [], commenterRoles: [], securityClassification: null },
      after: {
        name: 'Case',
        adminRoles: ['admin'],
        readerRoles: [],
        commenterRoles: [],
        securityClassification: 'protected a',
      },
    });
    expect(details.metadata).toEqual({
      typeId: 'case',
      updatedFields: ['adminRoles', 'securityClassification'],
      rolesChanged: true,
    });
  });

  describe('recordCommentAudit', () => {
    const logger = { warn: jest.fn() };
    const auditService = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };

    beforeEach(() => {
      logger.warn.mockReset();
      auditService.record.mockReset();
    });

    const record = (getDetails = () => toTopicAuditDetails(user, topic)) =>
      recordCommentAudit(
        auditService as unknown as AuditService,
        logger as unknown as Logger,
        TopicCreatedAuditAction,
        getDetails,
      );

    it('does not log when recording is disabled', async () => {
      auditService.record.mockResolvedValueOnce({
        status: 'rejected',
        eventId: '1',
        code: 'audit_disabled',
        reason: '',
      });
      record();
      await new Promise(process.nextTick);

      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('logs an event that is not recorded', async () => {
      auditService.record.mockResolvedValueOnce({
        status: 'failed',
        eventId: '1',
        reason: 'request_failed',
        error: '',
      });
      record();
      await new Promise(process.nextTick);

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('not recorded'), expect.any(Object));
    });

    it('logs instead of throwing when details cannot be built', () => {
      expect(() =>
        record(() => {
          throw new Error('no user');
        }),
      ).not.toThrow();
      expect(auditService.record).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('skips an event without a tenant', () => {
      record(() => ({ ...toTopicAuditDetails(user, topic), tenantId: undefined }));
      expect(auditService.record).not.toHaveBeenCalled();
    });
  });
});
