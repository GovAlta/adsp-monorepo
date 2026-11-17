import { adspId, AuditService } from '@abgov/adsp-service-sdk';
import { UnauthorizedError, WorkQueueService } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { AnonymousAuditActor, FeedbackSubmittedAuditAction } from './audit';
import { FeedbackWorkItem } from './job';
import { ServiceRoles } from './roles';
import { sendFeedback } from './router';

describe('sendFeedback audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const site = 'https://test.org';
  const comment = 'My name is Jane Doe.';
  const technicalIssue = 'Call me at 780-555-0100.';

  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn() } as unknown as Logger;
  const queueServiceMock = { enqueue: jest.fn() };
  const auditServiceMock = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };

  const handler = sendFeedback(
    loggerMock,
    queueServiceMock as unknown as WorkQueueService<FeedbackWorkItem>,
    auditServiceMock as unknown as AuditService,
  );

  const send = async (user: unknown, body: Record<string, unknown>, allowAnonymous = true) => {
    const req = {
      tenant: { id: tenantId },
      user,
      body: { context: { site, view: '/apply' }, rating: 'good', ...body },
      getConfiguration: jest.fn().mockResolvedValue({ sites: { [site]: { url: new URL(site), allowAnonymous } } }),
    };
    const res = { json: jest.fn() };
    const next = jest.fn();
    await handler(req as unknown as Request, res as unknown as Response, next);
    return { res, next };
  };

  beforeEach(() => {
    queueServiceMock.enqueue.mockReset();
    auditServiceMock.record.mockReset();
  });

  it('records feedback submitted by a user without the text', async () => {
    queueServiceMock.enqueue.mockResolvedValueOnce(undefined);
    const user = { id: 'tester', name: 'Tester', tenantId, roles: [ServiceRoles.FeedbackProvider] };

    const { res } = await send(user, { comment, technicalIssue });

    expect(res.json).toHaveBeenCalledWith({ sent: true });
    const [{ id }] = queueServiceMock.enqueue.mock.calls[0];
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
    expect(auditServiceMock.record).toHaveBeenCalledWith(FeedbackSubmittedAuditAction, {
      tenantId,
      actor: expect.objectContaining({ id: 'tester', type: 'user', name: 'Tester' }),
      resource: { type: 'feedback', id },
      correlationId: undefined,
      metadata: {
        site,
        view: '/apply',
        rating: 'good',
        commentProvided: true,
        technicalIssueProvided: true,
      },
    });
    const recorded = JSON.stringify(auditServiceMock.record.mock.calls);
    expect(recorded).not.toContain(comment);
    expect(recorded).not.toContain(technicalIssue);
  });

  it('records anonymous feedback without comment', async () => {
    queueServiceMock.enqueue.mockResolvedValueOnce(undefined);

    await send(undefined, { context: { site, view: '/apply', correlationId: 'application-1' } });

    expect(auditServiceMock.record).toHaveBeenCalledWith(
      FeedbackSubmittedAuditAction,
      expect.objectContaining({
        actor: AnonymousAuditActor,
        correlationId: 'application-1',
        metadata: expect.objectContaining({ commentProvided: false, technicalIssueProvided: false }),
      }),
    );
  });

  it('records feedback sent by a service account as a service actor', async () => {
    queueServiceMock.enqueue.mockResolvedValueOnce(undefined);
    const user = { id: 'sa', name: 'service-account-my-app', tenantId, roles: [ServiceRoles.FeedbackProvider] };

    await send(user, {});

    expect(auditServiceMock.record).toHaveBeenCalledWith(
      FeedbackSubmittedAuditAction,
      expect.objectContaining({ actor: expect.objectContaining({ id: 'sa', type: 'service' }) }),
    );
  });

  it('does not record rejected feedback', async () => {
    const { next } = await send(undefined, { comment }, false);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(auditServiceMock.record).not.toHaveBeenCalled();
  });

  it('does not record feedback that cannot be queued', async () => {
    queueServiceMock.enqueue.mockRejectedValueOnce(new Error('oh noes!'));

    const { next } = await send(undefined, { comment });

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(auditServiceMock.record).not.toHaveBeenCalled();
  });
});
