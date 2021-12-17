import { AdspId, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import { UnauthorizedError } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import { TemplateService } from '../template';
import {
  NotificationType,
  Notification,
  NotificationTypeEvent,
  SubscriptionCriteria,
  ServiceUserRoles,
  Subscriber,
} from '../types';
import { SubscriberEntity } from './subscriber';
import { SubscriptionEntity } from './subscription';

export class NotificationTypeEntity implements NotificationType {
  tenantId?: AdspId;
  id: string;
  name: string;
  description: string;
  publicSubscribe = false;
  subscriberRoles: string[] = [];
  events: NotificationTypeEvent[] = [];

  constructor(type: NotificationType, tenantId?: AdspId) {
    this.tenantId = tenantId;
    Object.assign(this, type);
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
        (this.publicSubscribe || isAllowedUser(user, this.tenantId, [...this.subscriberRoles])))
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

    return await SubscriptionEntity.create(repository, subscriber, {
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

  generateNotifications(
    templateService: TemplateService,
    event: DomainEvent,
    subscriptions: SubscriptionEntity[]
  ): Notification[] {
    const notifications: Notification[] = [];
    subscriptions.forEach((subscription) => {
      if (subscription.shouldSend(event)) {
        const notification = this.generateNotification(templateService, event, subscription);
        if (notification) {
          notifications.push(notification);
        }
      }
    });

    return notifications;
  }

  private generateNotification(
    templateService: TemplateService,
    event: DomainEvent,
    subscription: SubscriptionEntity
  ): Notification {
    const eventNotification = this.events.find((e) => e.namespace === event.namespace && e.name === event.name);
    const { address, channel } = (eventNotification && subscription.getSubscriberChannel(eventNotification)) || {};

    if (!address) {
      // TODO: This should get logged;
      return null;
    } else {
      return {
        tenantId: this.tenantId?.toString(),
        type: {
          id: this.id,
          name: this.name,
        },
        event: {
          namespace: event.namespace,
          name: event.name,
        },
        correlationId: event.correlationId,
        context: event.context,
        to: address,
        channel,
        message: templateService.generateMessage(eventNotification.templates[channel], {
          event,
          subscriber: subscription.subscriber,
        }),
        subscriber: {
          id: subscription.subscriber.id,
          userId: subscription.subscriber.userId,
          addressAs: subscription.subscriber.addressAs,
        },
      };
    }
  }
}
