import { adspId, Channel } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { createMessageNotificationJob, REVIEWER_NOTIFICATION_TYPE_ID } from './messageNotification';
import {
  FORM_MESSAGE_FORWARDED,
  FORM_MESSAGE_TO_APPLICANT,
  FORM_MESSAGE_TO_REVIEWER,
} from '../events';

describe('messageNotification', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const formUrn = 'urn:ads:platform:form-service:v1:/forms/form-1';
  const subscriberUrn = adspId`urn:ads:platform:notification-service:v1:/subscribers/subscriber-1`;

  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const repository = { get: jest.fn() };
  const commentService = { createSupportTopic: jest.fn(), getComment: jest.fn() };
  const notificationService = {
    getSubscriber: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    hasSubscribers: jest.fn(),
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
  };
  const eventService = { send: jest.fn() };

  const form = {
    id: 'form-1',
    tenantId,
    createdBy: { id: 'applicant-1', name: 'Applicant' },
    applicant: { urn: subscriberUrn },
    definition: {
      id: 'licence',
      name: 'Business licence application',
      reviewConfiguration: { columns: [], questionsEmail: 'intake@gov.ab.ca' },
    },
  };

  const commentCreated = (createdById: string, overrides = {}) => ({
    namespace: 'comment-service',
    name: 'comment-created',
    timestamp: new Date('2026-08-31T12:00:00.000Z'),
    tenantId,
    correlationId: formUrn,
    context: { topicTypeId: 'form-questions', topicId: 12, resourceId: formUrn, commentId: 34 },
    payload: { createdBy: { id: createdById } },
    ...overrides,
  });

  const createJob = () =>
    createMessageNotificationJob({
      apiId,
      logger,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository: repository as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      commentService: commentService as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notificationService: notificationService as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eventService: eventService as any,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    repository.get.mockResolvedValue(form);
    notificationService.getSubscriber.mockResolvedValue({
      channels: [{ channel: Channel.email, address: 'applicant@test.co' }],
    });
    notificationService.hasSubscribers.mockResolvedValue(false);
    commentService.getComment.mockResolvedValue({ content: 'Where do I upload my licence?' });
  });

  it('notifies the applicant when a reviewer sends a message', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createJob()(commentCreated('reviewer-1') as any);

    expect(eventService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: FORM_MESSAGE_TO_APPLICANT,
        payload: expect.objectContaining({ recipientEmail: 'applicant@test.co' }),
      }),
    );
  });

  it('does not include the message when notifying the applicant', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createJob()(commentCreated('reviewer-1') as any);

    expect(eventService.send.mock.calls[0][0].payload).not.toHaveProperty('message');
  });

  it('notifies a reviewer that is part of the conversation', async () => {
    notificationService.hasSubscribers.mockResolvedValue(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createJob()(commentCreated('applicant-1') as any);

    expect(notificationService.hasSubscribers).toHaveBeenCalledWith(
      tenantId,
      REVIEWER_NOTIFICATION_TYPE_ID,
      `${apiId}:/forms/form-1`,
    );
    expect(eventService.send).toHaveBeenCalledWith(expect.objectContaining({ name: FORM_MESSAGE_TO_REVIEWER }));
  });

  it('forwards the question with its message when no reviewer is part of the conversation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createJob()(commentCreated('applicant-1') as any);

    expect(commentService.getComment).toHaveBeenCalledWith(tenantId, 12, 34);
    expect(eventService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: FORM_MESSAGE_FORWARDED,
        payload: expect.objectContaining({
          recipientEmail: 'intake@gov.ab.ca',
          message: 'Where do I upload my licence?',
        }),
      }),
    );
  });

  it('sends nothing when no reviewer is known and no address is configured', async () => {
    repository.get.mockResolvedValue({
      ...form,
      definition: { ...form.definition, reviewConfiguration: { columns: [] } },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createJob()(commentCreated('applicant-1') as any);

    expect(eventService.send).not.toHaveBeenCalled();
  });

  it('sends nothing when the applicant has no email address', async () => {
    repository.get.mockResolvedValue({ ...form, applicant: null });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createJob()(commentCreated('reviewer-1') as any);

    expect(eventService.send).not.toHaveBeenCalled();
  });

  it('ignores comments on topics that are not form questions', async () => {
    const event = commentCreated('reviewer-1', {
      context: { topicTypeId: 'other-topic', topicId: 12, resourceId: formUrn, commentId: 34 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createJob()(event as any);

    expect(repository.get).not.toHaveBeenCalled();
    expect(eventService.send).not.toHaveBeenCalled();
  });

  it('ignores events other than a created comment', async () => {
    const event = commentCreated('reviewer-1', { name: 'comment-deleted' });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createJob()(event as any);

    expect(repository.get).not.toHaveBeenCalled();
  });

  it('does not throw when the form cannot be read', async () => {
    repository.get.mockRejectedValue(new Error('oh noes!'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(createJob()(commentCreated('reviewer-1') as any)).resolves.toBeUndefined();
    expect(eventService.send).not.toHaveBeenCalled();
  });
});
