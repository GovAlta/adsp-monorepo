import axios from 'axios';
import { adspId } from '@abgov/adsp-service-sdk';
import type { AuditService } from '@abgov/adsp-service-sdk';
import { ConfigurationClient } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import {
  CommentCreatedAuditAction,
  CommentDeletedAuditAction,
  CommentUpdatedAuditAction,
  TopicCreatedAuditAction,
  TopicDeletedAuditAction,
  TopicTypeCreatedAuditAction,
  TopicTypeDeletedAuditAction,
  TopicTypeUpdatedAuditAction,
  TopicUpdatedAuditAction,
} from '../audit';
import { TopicEntity, TopicTypeEntity } from '../model';
import { TopicRepository } from '../repository';
import { ServiceRoles } from '../roles';
import {
  createTopic,
  createTopicComment,
  createTopicType,
  deleteTopic,
  deleteTopicComment,
  deleteTopicType,
  getTopicComments,
  updateTopic,
  updateTopicComment,
  updateTopicType,
} from './topic';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('topic router audit', () => {
  const apiId = adspId`urn:ads:platform:comment-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const resourceId = adspId`urn:ads:platform:form-service:v1:/forms/form-1`;
  const commentText = 'Sensitive decision rationale';
  const commentTitle = 'Sensitive title';

  const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn() } as unknown as Logger;
  const eventService = { send: jest.fn() };
  const directory = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() };
  const tokenProvider = { getAccessToken: jest.fn() };
  const clientMock = { getTenantConfiguration: jest.fn(), getCoreConfiguration: jest.fn() };
  const client = clientMock as unknown as ConfigurationClient<Record<string, TopicTypeEntity>>;
  const auditService = {
    record: jest.fn(),
    query: jest.fn(),
    flush: jest.fn(),
    droppedEventCount: 0,
  };
  const repositoryMock = {
    getTopic: jest.fn(),
    getTopics: jest.fn(),
    getComment: jest.fn(),
    getComments: jest.fn(),
    countTopics: jest.fn(),
    countTopicsByType: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    saveComment: jest.fn((_topic, comment) => Promise.resolve({ ...comment, id: comment.id ?? 2 })),
    delete: jest.fn(),
    deleteComment: jest.fn(),
  };
  const repository = repositoryMock as unknown as TopicRepository;

  const typeValues = {
    id: 'case',
    name: 'Case',
    adminRoles: ['case-admin'],
    commenterRoles: ['case-commenter'],
    readerRoles: ['case-reader'],
  };
  const type = new TopicTypeEntity(tenantId, typeValues);

  const user = { tenantId, id: 'user-1', name: 'Tester', email: 'tester@gov.ab.ca', roles: [] as string[] };
  const setter = { ...user, roles: [ServiceRoles.TopicSetter] };
  const commenter = { ...user, roles: ['case-commenter'] };
  const caseAdmin = { ...user, id: 'admin-1', roles: ['case-admin'] };

  const newTopic = () =>
    new TopicEntity(repository, type, {
      tenantId,
      id: 1,
      typeId: type.id,
      name: 'Case 1',
      description: 'Private description',
      resourceId,
      commenters: ['external-1'],
    } as never);

  const existingComment = () => ({
    topicId: 1,
    id: 2,
    title: commentTitle,
    content: commentText,
    context: { decision: commentText },
    createdBy: { id: 'author-1', name: 'Author' },
    createdOn: new Date(),
    lastUpdatedBy: { id: 'author-1', name: 'Author' },
    lastUpdatedOn: new Date(),
  });

  const res = () => ({ send: jest.fn(), status: jest.fn().mockReturnThis() });
  const recorded = () => auditService.record.mock.calls;
  const audit = auditService as unknown as AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    auditService.record.mockResolvedValue({ status: 'recorded', eventId: 'event-1' });
    directory.getServiceUrl.mockResolvedValue(new URL('http://configuration-service/'));
    tokenProvider.getAccessToken.mockResolvedValue('token');
    axiosMock.patch.mockResolvedValue({ data: {} });
  });

  describe('topic types', () => {
    it('records topic-type.created by the request user', async () => {
      clientMock.getTenantConfiguration.mockResolvedValueOnce({ case: type });
      const req = {
        user: setter,
        tenant: { id: tenantId },
        body: { id: 'case', name: 'Case', readRoles: ['case-reader'], writeRoles: ['case-commenter'] },
        getConfiguration: jest.fn().mockResolvedValue({}),
      };
      const next = jest.fn();

      await createTopicType(
        apiId,
        logger,
        directory,
        client,
        tokenProvider,
        audit,
      )(req as unknown as Request, res() as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledWith(
        TopicTypeCreatedAuditAction,
        expect.objectContaining({
          tenantId,
          actor: expect.objectContaining({ id: user.id, type: 'user' }),
          resource: { type: 'topic-type', id: 'case', name: 'Case' },
          metadata: {
            typeId: 'case',
            adminRoles: ['case-admin'],
            readerRoles: ['case-reader'],
            commenterRoles: ['case-commenter'],
          },
        }),
      );
    });

    it('records topic-type.updated with the roles before and after', async () => {
      clientMock.getTenantConfiguration.mockResolvedValueOnce({ case: type });
      const req = {
        user: setter,
        tenant: { id: tenantId },
        params: { topicTypeId: 'case' },
        body: { commenterRoles: ['case-commenter', 'case-reviewer'] },
      };

      await updateTopicType(
        apiId,
        logger,
        directory,
        client,
        tokenProvider,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(auditService.record).toHaveBeenCalledWith(
        TopicTypeUpdatedAuditAction,
        expect.objectContaining({
          resource: { type: 'topic-type', id: 'case', name: 'Case' },
          metadata: { typeId: 'case', updatedFields: ['commenterRoles'], rolesChanged: true },
          changeSet: {
            before: expect.objectContaining({ commenterRoles: ['case-commenter'] }),
            after: expect.objectContaining({ commenterRoles: ['case-commenter', 'case-reviewer'] }),
          },
        }),
      );
    });

    it('records topic-type.updated without roles changed for a rename', async () => {
      clientMock.getTenantConfiguration.mockResolvedValueOnce({ case: type });
      const req = {
        user: setter,
        tenant: { id: tenantId },
        params: { topicTypeId: 'case' },
        body: { name: 'Cases' },
      };

      await updateTopicType(
        apiId,
        logger,
        directory,
        client,
        tokenProvider,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(recorded()[0][1].metadata).toEqual({ typeId: 'case', updatedFields: ['name'], rolesChanged: false });
    });

    it('records topic-type.deleted', async () => {
      clientMock.getTenantConfiguration.mockResolvedValueOnce({ case: type });
      repositoryMock.countTopicsByType.mockResolvedValueOnce(0);
      const req = { user: setter, tenant: { id: tenantId }, params: { topicTypeId: 'case' } };

      await deleteTopicType(
        apiId,
        logger,
        repository,
        directory,
        client,
        tokenProvider,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(auditService.record).toHaveBeenCalledWith(
        TopicTypeDeletedAuditAction,
        expect.objectContaining({ tenantId, resource: { type: 'topic-type', id: 'case', name: 'Case' } }),
      );
    });

    it('does not record a topic type delete rejected because topics use the type', async () => {
      clientMock.getTenantConfiguration.mockResolvedValueOnce({ case: type });
      repositoryMock.countTopicsByType.mockResolvedValueOnce(2);
      const req = { user: setter, tenant: { id: tenantId }, params: { topicTypeId: 'case' } };

      await deleteTopicType(
        apiId,
        logger,
        repository,
        directory,
        client,
        tokenProvider,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('does not record when the user is not allowed to create topic types', async () => {
      const req = { user, tenant: { id: tenantId }, body: { id: 'case', name: 'Case' } };
      const next = jest.fn();

      await createTopicType(
        apiId,
        logger,
        directory,
        client,
        tokenProvider,
        audit,
      )(req as unknown as Request, res() as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  describe('topics', () => {
    it('records topic.created with the linked resource as correlation ID', async () => {
      const req = {
        user: setter,
        tenant: { id: tenantId },
        body: { typeId: 'case', name: 'Case 1', description: 'Private description', resourceId: resourceId.toString() },
        getConfiguration: jest.fn().mockResolvedValue({ case: type }),
      };
      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(Object.assign(entity, { id: 1 })));

      await createTopic(
        apiId,
        logger,
        repository,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(auditService.record).toHaveBeenCalledWith(TopicCreatedAuditAction, {
        tenantId,
        actor: expect.objectContaining({ id: user.id, type: 'user' }),
        resource: { type: 'topic', id: '1', name: 'Case 1' },
        correlationId: resourceId.toString(),
        metadata: { topicId: 1, typeId: 'case', resourceId: resourceId.toString(), securityClassification: null },
      });
    });

    it('does not record a topic create by a user without the topic setter role', async () => {
      const req = {
        user,
        tenant: { id: tenantId },
        body: { typeId: 'case', name: 'Case 1' },
        getConfiguration: jest.fn().mockResolvedValue({ case: type }),
      };
      const next = jest.fn();

      await createTopic(
        apiId,
        logger,
        repository,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('records topic.updated with commenter changes but not the description', async () => {
      const req = {
        user: setter,
        body: { description: 'Another private description', commenters: ['external-1', 'external-2'] },
        topic: newTopic(),
      };

      await updateTopic(
        apiId,
        logger,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      const [action, details] = recorded()[0];
      expect(action).toBe(TopicUpdatedAuditAction);
      expect(details.metadata.updatedFields).toEqual(['description', 'commenters']);
      expect(details.changeSet).toEqual({
        before: { commenters: ['external-1'] },
        after: { commenters: ['external-1', 'external-2'] },
      });
      expect(JSON.stringify(details)).not.toContain('private description');
    });

    it('records a single topic.deleted when the topic has comments', async () => {
      repositoryMock.delete.mockResolvedValueOnce(true);
      const req = { user: setter, topic: newTopic() };

      await deleteTopic(
        apiId,
        logger,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledWith(
        TopicDeletedAuditAction,
        expect.objectContaining({ tenantId, resource: { type: 'topic', id: '1', name: 'Case 1' } }),
      );
    });

    it('does not record when the topic is not deleted', async () => {
      repositoryMock.delete.mockResolvedValueOnce(false);
      const req = { user: setter, topic: newTopic() };

      await deleteTopic(
        apiId,
        logger,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  describe('comments', () => {
    it('records comment.created without the comment text', async () => {
      const req = {
        user: commenter,
        body: {
          title: commentTitle,
          content: commentText,
          context: { decision: commentText },
          requiresAttention: true,
        },
        topic: newTopic(),
      };

      await createTopicComment(
        apiId,
        logger,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      const [action, details] = recorded()[0];
      expect(action).toBe(CommentCreatedAuditAction);
      expect(details).toEqual({
        tenantId,
        actor: expect.objectContaining({ id: user.id, type: 'user' }),
        resource: { type: 'comment', id: '2' },
        correlationId: resourceId.toString(),
        metadata: {
          topicId: 1,
          typeId: 'case',
          resourceId: resourceId.toString(),
          commentAction: 'created',
          requiresAttention: true,
        },
      });
      expect(JSON.stringify(details)).not.toContain(commentText);
      expect(JSON.stringify(details)).not.toContain(commentTitle);
    });

    it('records a service account as a service actor', async () => {
      const req = {
        user: { ...commenter, id: 'service-1', name: 'service-account-form-service' },
        body: { content: commentText },
        topic: newTopic(),
      };

      await createTopicComment(
        apiId,
        logger,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(recorded()[0][1].actor).toEqual(expect.objectContaining({ id: 'service-1', type: 'service' }));
    });

    it('does not record a comment by a user who cannot comment', async () => {
      const req = { user, body: { content: commentText }, topic: newTopic() };
      const next = jest.fn();

      await createTopicComment(
        apiId,
        logger,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('records comment.updated with the edited field names and author only', async () => {
      repositoryMock.getComment.mockResolvedValueOnce(existingComment());
      const req = {
        user: caseAdmin,
        params: { commentId: '2' },
        body: { content: 'Edited sensitive content' },
        topic: newTopic(),
      };

      await updateTopicComment(
        apiId,
        logger,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      const [action, details] = recorded()[0];
      expect(action).toBe(CommentUpdatedAuditAction);
      expect(details.actor.id).toBe('admin-1');
      expect(details.metadata).toEqual(
        expect.objectContaining({ commentAction: 'updated', authorId: 'author-1', updatedFields: ['content'] }),
      );
      expect(JSON.stringify(details)).not.toContain('Edited sensitive content');
      expect(JSON.stringify(details)).not.toContain(commentText);
    });

    it('records comment.deleted with the author', async () => {
      repositoryMock.getComment.mockResolvedValueOnce(existingComment());
      repositoryMock.deleteComment.mockResolvedValueOnce(true);
      const req = { user: caseAdmin, params: { commentId: '2' }, topic: newTopic() };

      await deleteTopicComment(
        apiId,
        logger,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      const [action, details] = recorded()[0];
      expect(action).toBe(CommentDeletedAuditAction);
      expect(details.resource).toEqual({ type: 'comment', id: '2' });
      expect(details.metadata).toEqual(expect.objectContaining({ commentAction: 'deleted', authorId: 'author-1' }));
      expect(JSON.stringify(details)).not.toContain(commentText);
    });

    it('does not record when the comment is not deleted', async () => {
      repositoryMock.getComment.mockResolvedValueOnce(existingComment());
      repositoryMock.deleteComment.mockResolvedValueOnce(false);
      const req = { user: caseAdmin, params: { commentId: '2' }, topic: newTopic() };

      await deleteTopicComment(
        apiId,
        logger,
        eventService,
        audit,
      )(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('does not record listing comments', async () => {
      repositoryMock.getComments.mockResolvedValueOnce({ results: [existingComment()], page: {} });
      const req = { user: commenter, query: {}, topic: newTopic() };

      await getTopicComments()(req as unknown as Request, res() as unknown as Response, jest.fn());

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  it('does not fail the request when recording fails', async () => {
    auditService.record.mockRejectedValueOnce(new Error('unavailable'));
    const req = { user: commenter, body: { content: commentText }, topic: newTopic() };
    const response = res();
    const next = jest.fn();

    await createTopicComment(
      apiId,
      logger,
      eventService,
      audit,
    )(req as unknown as Request, response as unknown as Response, next);
    await new Promise(process.nextTick);

    expect(response.send).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});
