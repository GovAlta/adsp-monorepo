import { AdspId, Channel, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import { InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import { getTemplateBody } from '@core-services/notification-shared';
import { get as getAtPath } from 'lodash';
import { Logger } from 'winston';
import { SubscriptionRepository } from '../repository';
import { TemplateService } from '../template';
import {
  NotificationType,
  Notification,
  NotificationTypeEvent,
  SubscriptionCriteria,
  ServiceUserRoles,
  Subscriber,
  Template,
} from '../types';
import { SubscriberEntity } from './subscriber';
import { SubscriptionEntity } from './subscription';
import { NotificationConfiguration } from '../configuration';

function isValidSms(digits) {
  return /^\d{10}$/.test(digits);
}

export class NotificationTypeEntity implements NotificationType {
  tenantId?: AdspId;
  id: string;
  name: string;
  description: string;
  publicSubscribe = false;
  manageSubscribe = false;
  Subscribe = false;
  subscriberRoles: string[] = [];
  channels: Channel[] = [];
  events: NotificationTypeEvent[] = [];

  constructor(type: NotificationType, tenantId?: AdspId) {
    Object.assign(this, type);
    this.tenantId = tenantId;
  }

  canSubscribe(user: User, subscriber: Subscriber): boolean {
    // User is an subscription admin, or user has subscriber role and is creating subscription for self.

    return (
      isAllowedUser(
        user,
        this.tenantId,
        [ServiceUserRoles.SubscriptionAdmin, ServiceUserRoles.SubscriptionApp],
        true
      ) ||
      (!!user &&
        user?.id === subscriber.userId &&
        (this.publicSubscribe || isAllowedUser(user, this.tenantId, [...this.subscriberRoles])) &&
        this.manageSubscribe)
    );
  }

  async subscribe(
    repository: SubscriptionRepository,
    user: User,
    subscriber: SubscriberEntity,
    criteria?: SubscriptionCriteria
  ): Promise<SubscriptionEntity> {
    if (!this.canSubscribe(user, subscriber)) {
      throw new UnauthorizedError('User not authorized to subscribe.');
    }

    return await SubscriptionEntity.create(repository, this, subscriber, {
      tenantId: subscriber.tenantId,
      typeId: this.id,
      subscriberId: subscriber.id,
      criteria,
    });
  }

  async unsubscribe(repository: SubscriptionRepository, user: User, subscriber: SubscriberEntity): Promise<boolean> {
    if (!this.canSubscribe(user, subscriber)) {
      throw new UnauthorizedError('User not authorized to unsubscribe.');
    }

    return repository.deleteSubscriptions(subscriber.tenantId, this.id, subscriber.id);
  }

  async generateNotifications(
    logger: Logger,
    templateService: TemplateService,
    subscriberAppUrl: URL,
    subscriptionRepository: SubscriptionRepository,
    configuration: NotificationConfiguration,
    event: DomainEvent,
    messageContext: Record<string, unknown>
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    // Page through all subscriptions and generate notifications.
    let after: string = null;
    let pageNumber = 1,
      count = 0;
    do {
      logger.debug(
        `Processing page ${pageNumber} of subscriptions of type ${this.id} for event ${event.namespace}:${event.name}...`,
        {
          context: 'NotificationType',
          tenant: event.tenantId?.toString(),
        }
      );

      const { results: subscriptions, page } = await subscriptionRepository.getSubscriptions(
        configuration,
        event.tenantId,
        1000,
        after,
        {
          typeIdEquals: this.id,
          // Include event correlationId and context to filter out subscriptions with criteria that don't match.
          // NOTE: This means that the effective evaluation of whether a subscription results in a notification is based on:
          // 1. the repository query for retrieving subscriptions; and
          // 2. the shouldSend() method of the subscription entity.
          subscriptionMatch: {
            correlationId: event.correlationId,
            context: event.context,
          },
        }
      );

      for (const subscription of subscriptions) {
        if (subscription.shouldSend(event)) {
          const notification = this.generateNotification(
            logger,
            templateService,
            configuration,
            subscriberAppUrl,
            event,
            subscription,
            messageContext
          );
          if (notification) {
            notifications.push(notification);
          }
        }
      }
      after = page.next;
      pageNumber++;
      count += page.size;
    } while (after);

    logger.debug(`Processed ${count} subscriptions of type ${this.id} for event ${event.namespace}:${event.name}.`, {
      context: 'NotificationType',
      tenant: event.tenantId?.toString(),
    });

    return notifications;
  }

  overrideWith(customType: NotificationTypeEntity): NotificationTypeEntity {
    // This needs to make a deep copy to avoid the modified template applying to the base type entity.
    const events: NotificationTypeEvent[] = this.events.map((event) => {
      const overrideEvent = customType.events.find(
        (customEvent) => customEvent.namespace === event.namespace && customEvent.name === event.name
      );
      const templates = overrideEvent ? { ...event.templates, ...overrideEvent.templates } : event.templates;
      return { ...event, templates };
    });

    return new NotificationTypeEntity({ ...this, events }, customType.tenantId);
  }

  private generateNotification(
    logger: Logger,
    templateService: TemplateService,
    configurationService: NotificationConfiguration,
    subscriberAppUrl: URL,
    event: DomainEvent,
    subscription: SubscriptionEntity,
    messageContext: Record<string, unknown>
  ): Notification {
    const eventNotification = this.events.find((e) => e.namespace === event.namespace && e.name === event.name);

    const { address, channel } =
      (eventNotification && subscription.getSubscriberChannel(this, eventNotification)) || {};

    if (!address) {
      logger.warn(
        `No matching channel for subscriber '${subscription.subscriber?.addressAs}' (ID: ${subscription.subscriber?.id}) on type ${this.id} for event ${event.namespace}:${event.name}.`,
        {
          context: 'NotificationType',
          tenant: event.tenantId?.toString(),
        }
      );

      return null;
    } else {
      const subscriber = {
        id: subscription.subscriber.id,
        userId: subscription.subscriber.userId,
        addressAs: subscription.subscriber.addressAs,
      };

      const context = {
        ...messageContext,
        event,
        subscriber,
        managementUrl: subscriberAppUrl ? new URL(`/${subscriber.id}`, subscriberAppUrl).href : null,
        title: eventNotification.templates[channel].title ?? '',
        subtitle: eventNotification.templates[channel].subtitle ?? '',
      };

      return {
        tenantId: event.tenantId.toString(),
        type: {
          id: this.id,
          name: this.name,
        },
        event: {
          namespace: event.namespace,
          name: event.name,
          timestamp: event.timestamp,
        },
        correlationId: event.correlationId,
        context: event.context,
        to: address,
        from: configurationService.email?.fromEmail,
        channel,
        message: templateService.generateMessage(
          this.getTemplate(channel, eventNotification.templates[channel], context),
          context
        ),
        subscriber,
      };
    }
  }

  protected getTemplate(channel: Channel, template: Template, context: Record<string, unknown>): Template {
    const effectiveTemplate = { ...template };
    if (channel === Channel.email) {
      effectiveTemplate.body = getTemplateBody(template.body.toString(), channel, context);
    }
    return effectiveTemplate;
  }
}
/**
 * Represents a notification type that generates notification based on trigger event without requiring a subscription.
 *
 * Note: This is a subclass because subscription-based notifications were implemented first.
 *
 * @export
 * @class DirectNotificationTypeEntity
 * @extends {NotificationTypeEntity}
 * @implements {NotificationType}
 */
export class DirectNotificationTypeEntity extends NotificationTypeEntity implements NotificationType {
  addressPath?: string;
  address?: string;
  ccPath?: string;
  bccPath?: string;
  subjectPath?: string;
  titlePath?: string;
  subTitlePath?: string;

  constructor(type: NotificationType, tenantId?: AdspId) {
    super(type, tenantId);

    if (!this.addressPath && !this.address) {
      throw new InvalidOperationError('Direct notification type must include an addressPath or address.');
    }
  }

  override async subscribe(
    _repository: SubscriptionRepository,
    _user: User,
    _subscriber: SubscriberEntity,
    _criteria?: SubscriptionCriteria
  ): Promise<SubscriptionEntity> {
    throw new InvalidOperationError('Direct notification types cannot be subscribed to.');
  }

  override async unsubscribe(
    _repository: SubscriptionRepository,
    _user: User,
    _subscriber: SubscriberEntity
  ): Promise<boolean> {
    throw new InvalidOperationError('Direct notification types cannot be subscribed to.');
  }

  override async generateNotifications(
    logger: Logger,
    templateService: TemplateService,
    _subscriberAppUrl: URL,
    _subscriptionRepository: SubscriptionRepository,
    configuration: NotificationConfiguration,
    event: DomainEvent,
    messageContext: Record<string, unknown>
  ): Promise<Notification[]> {
    logger.debug(`Processing direct notification type ${this.id} for event ${event.namespace}:${event.name}...`, {
      context: 'NotificationType',
      tenant: event.tenantId?.toString(),
    });

    const eventNotification = this.events.find((e) => e.namespace === event.namespace && e.name === event.name);

    // Address can now be a phone number
    let [channel] = this.channels;
    if (isValidSms(this.address) && this.channels.includes(Channel.sms)) {
      channel = Channel.sms;
    }

    const address = (this?.addressPath && getAtPath(event.payload, this.addressPath)) || this.address;
    const cc = (this?.ccPath && getAtPath(event.payload, this.ccPath)) || [];
    const bcc = (this?.bccPath && getAtPath(event.payload, this.bccPath)) || [];
    const titleInEvent = this?.titlePath && getAtPath(event.payload, this.titlePath);
    const subTitleInEvent = this?.subTitlePath && getAtPath(event.payload, this.subTitlePath);
    const subjectInEvent = this?.subjectPath && getAtPath(event.payload, this.subjectPath);

    const notifications = [];
    if (eventNotification && channel && address && eventNotification.templates[channel]) {
      const context = {
        ...messageContext,
        event,
      };

      const template = eventNotification.templates[channel];

      const message = templateService.generateMessage(
        this.getTemplate(channel, template, {
          ...context,
          title: titleInEvent || template?.title,
          subtitle: subTitleInEvent || template?.subtitle,
        }),
        context
      );

      notifications.push({
        tenantId: event.tenantId.toString(),
        type: {
          id: this.id,
          name: this.name,
        },
        event: {
          namespace: event.namespace,
          name: event.name,
          timestamp: event.timestamp,
        },
        correlationId: event.correlationId,
        context: event.context,
        to: address,
        cc,
        bcc,
        from: configuration.email?.fromEmail,
        channel,
        message: subjectInEvent ? { ...message, subject: subjectInEvent } : message,
      });

      logger.debug(`Generated direct notification for type ${this.id} on event ${event.namespace}:${event.name}.`, {
        context: 'NotificationType',
        tenant: event.tenantId?.toString(),
      });
    } else if (eventNotification) {
      // Not resolving a notification type can be due to event criteria and isn't unexpected.
      // However, unresolved channel or address suggests broken configuration.
      logger.warn(
        `Direct notification type ${this.id} failed to resolve channel (${channel}), address (${address}), and/or channel template.`,
        {
          context: 'NotificationType',
          tenant: event.tenantId?.toString(),
        }
      );
    }

    return notifications;
  }
}
