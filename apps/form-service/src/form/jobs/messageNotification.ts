import { AdspId, Channel, EventService } from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';
import { Logger } from 'winston';
import { CommentService, SUPPORT_COMMENT_TOPIC_TYPE_ID } from '../comment';
import { formMessageForwarded, formMessageToApplicant, formMessageToReviewer } from '../events';
import { FormRepository } from '../repository';
import { NotificationService } from '../../notification';

const COMMENT_SERVICE_NAMESPACE = 'comment-service';
const COMMENT_CREATED = 'comment-created';

// Reviewers aren't recorded against a form; they subscribe to this type when they reply, so a
// subscription for the form is what tells us a reviewer is part of the conversation.
export const REVIEWER_NOTIFICATION_TYPE_ID = 'form-message-reviewer-notifications';

export interface MessageNotificationJobProps {
  apiId: AdspId;
  logger: Logger;
  repository: FormRepository;
  commentService: CommentService;
  notificationService: NotificationService;
  eventService: EventService;
}

function getFormId(resourceId: string): string {
  return /\/forms\/([^/]+)$/.exec(resourceId || '')?.[1];
}

/**
 * Notifies the other party by email when a message is posted on a form's support topic.
 *
 * Messages are posted straight to the comment service, so this reacts to the resulting domain event
 * rather than sitting in the request path. Nothing here can prevent a message from being saved.
 */
export function createMessageNotificationJob({
  apiId,
  logger,
  repository,
  commentService,
  notificationService,
  eventService,
}: MessageNotificationJobProps) {
  return async function (event: DomainEvent): Promise<void> {
    if (event?.namespace !== COMMENT_SERVICE_NAMESPACE || event?.name !== COMMENT_CREATED) {
      return;
    }

    if (event.context?.topicTypeId !== SUPPORT_COMMENT_TOPIC_TYPE_ID) {
      return;
    }

    try {
      const tenantId = event.tenantId;
      const formId = getFormId(event.context?.resourceId as string);
      const form = formId && (await repository.get(tenantId, formId));
      if (!form) {
        logger.warn(`No form found for message on topic resource ${event.context?.resourceId}; skipping notification.`);
        return;
      }

      // The applicant is the user that created the form and the only explicit commenter on the
      // topic; anyone else posting is a reviewer acting through their role.
      const createdBy = event.payload?.createdBy as { id?: string };
      const fromApplicant = createdBy?.id === form.createdBy?.id;
      if (!fromApplicant) {
        await notifyApplicant({ apiId, logger, notificationService, eventService }, form, event);
      } else {
        await notifyReviewer({ apiId, logger, commentService, notificationService, eventService }, form, event);
      }
    } catch (err) {
      // The message is already saved; a notification failure must not take the consumer down.
      logger.error(`Error encountered notifying of form message. ${err}`);
    }
  };
}

type FormOf<T> = T extends (tenantId: AdspId, id: string) => Promise<infer R> ? R : never;
type Form = FormOf<FormRepository['get']>;

async function notifyApplicant(
  {
    apiId,
    logger,
    notificationService,
    eventService,
  }: Pick<MessageNotificationJobProps, 'apiId' | 'logger' | 'notificationService' | 'eventService'>,
  form: Form,
  event: DomainEvent
): Promise<void> {
  const subscriber = form.applicant ? await notificationService.getSubscriber(form.tenantId, form.applicant.urn) : null;
  const address = subscriber?.channels?.find(({ channel }) => channel === Channel.email)?.address;

  // Forms created by an intake application on someone's behalf may have no applicant to write to.
  if (!address) {
    logger.info(`No applicant email address for form ${form.id}; no message notification sent.`);
    return;
  }

  eventService.send(formMessageToApplicant(apiId, form, address, event.timestamp));
}

async function notifyReviewer(
  {
    apiId,
    logger,
    commentService,
    notificationService,
    eventService,
  }: Pick<
    MessageNotificationJobProps,
    'apiId' | 'logger' | 'commentService' | 'notificationService' | 'eventService'
  >,
  form: Form,
  event: DomainEvent
): Promise<void> {
  const correlationId = `${apiId}:/forms/${form.id}`;
  const hasReviewer = await notificationService.hasSubscribers(form.tenantId, REVIEWER_NOTIFICATION_TYPE_ID, correlationId);
  if (hasReviewer) {
    eventService.send(formMessageToReviewer(apiId, form, event.timestamp));
    return;
  }

  const address = form.definition?.reviewConfiguration?.questionsEmail;
  if (!address) {
    logger.info(`No reviewer subscribed and no questions email set for form ${form.id}; no notification sent.`);
    return;
  }

  // This address is triaging the question rather than reading it in the app, so it needs the
  // message itself, which the comment created event does not carry.
  const comment = await commentService.getComment(
    form.tenantId,
    event.context?.topicId as number,
    event.context?.commentId as number
  );

  if (!comment?.content) {
    logger.warn(`Unable to read message ${event.context?.commentId} for form ${form.id}; no notification sent.`);
    return;
  }

  eventService.send(formMessageForwarded(apiId, form, address, comment.content, event.timestamp));
}
