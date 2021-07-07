import type { AdspId, User } from '@abgov/adsp-service-sdk';
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
  subscriberRoles: string[] = [];
  events: NotificationTypeEvent[] = [];

  constructor(type: NotificationType, tenantId?: AdspId) {
    this.tenantId = tenantId;
    Object.assign(this, type);
  }

  canSubscribe(user: User, subscriber: Subscriber): boolean {
    return (
      !!user &&
      (!this.tenantId || `${this.tenantId}` === `${user.tenantId}`) &&
      (user.roles.includes(ServiceUserRoles.SubscriptionAdmin) ||
        (user.id === subscriber.userId &&
          (this.subscriberRoles.length === 0 || !!this.subscriberRoles.find((r) => user.roles.includes(r)))))
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

    return SubscriptionEntity.create(repository, subscriber, {
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

    return repository.deleteSubscriptions(this.tenantId, this.id, subscriber.id);
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
    const { address, channel } = subscription.getSubscriberChannel(eventNotification) || {};

    return address
      ? {
          tenantId: this.tenantId.toString(),
          typeId: this.id,
          correlationId: event.correlationId,
          to: address,
          channel,
          message: templateService.generateMessage(
            eventNotification.templates[channel],
            event,
            subscription.subscriber
          ),
        }
      : null;
  }
}
