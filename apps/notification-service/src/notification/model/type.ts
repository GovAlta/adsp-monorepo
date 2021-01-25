import { DomainEvent, New, UnauthorizedError, Update, User, UserRole } from '@core-services/core-common';
import { NotificationTypeRepository, SubscriptionRepository } from '../repository';
import { TemplateService } from '../template';
import { NotificationType, Notification, EventNotificationType, ServiceUserRoles, SubscriptionCriteria } from '../types';
import { NotificationSpaceEntity } from './space';
import { SubscriberEntity } from './subscriber';
import { SubscriptionEntity } from './subscription';

export class NotificationTypeEntity implements NotificationType {
  spaceId: string;
  id: string;
  name: string;
  description: string;
  publicSubscribe: boolean;
  subscriberRoles: UserRole[] = [];
  events: EventNotificationType[] = [];

  static create(
    user: User,
    repository: NotificationTypeRepository, 
    space: NotificationSpaceEntity,
    id: string,
    type: New<NotificationType>
  ) {
    const entity = new NotificationTypeEntity(repository, {...type, spaceId: space.id, id}, space);
    
    if (!entity.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to create notification type.');
    }

    return repository.save(entity);
  }

  constructor(
    private repository: NotificationTypeRepository,
    type: NotificationType | New<NotificationType>,
    public space: NotificationSpaceEntity = null
  ) {
    Object.assign(this, type);
  }

  update(user: User, update: Update<NotificationType>) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update notification type.');
    }

    if (update.name) {
      this.name = update.name;
    }

    if (update.description) {
      this.description = update.description;
    }

    if (update.events) {
      this.events = update.events;
    }

    if (update.publicSubscribe) {
      this.publicSubscribe = update.publicSubscribe;
    }

    if (update.subscriberRoles) {
      this.subscriberRoles = update.subscriberRoles;
    }

    return this.repository.save(this);
  }

  canUpdate(user: User) {
    return user &&
      user.roles &&
      (
        user.roles.includes(ServiceUserRoles.Admin) ||
        user.roles.includes(this.space.spaceAdminRole)
      );
  }

  canSubscribe(user: User) {
    return this.publicSubscribe || 
      (
        user && 
        user.roles &&
        this.subscriberRoles.find(r => user.roles.includes(r))
      );
  }

  subscribe(
    repository: SubscriptionRepository,
    user: User, 
    subscriber: SubscriberEntity, 
    criteria?: SubscriptionCriteria
  ) {
    if (!this.canSubscribe(user)) {
      throw new UnauthorizedError('User not authorized to subscribe.');
    }
    
    return SubscriptionEntity.create(
      repository,
      { 
        spaceId: this.spaceId,
        typeId: this.id,
        subscriberId: subscriber.id,
        criteria
      }
    );
  }

  unsubscribe(
    repository: SubscriptionRepository,
    user: User, 
    subscriber: SubscriberEntity
  ) {
    if (!this.canSubscribe(user)) {
      throw new UnauthorizedError('User not authorized to unsubscribe.');
    }
    
    return repository.deleteSubscriptions(this.spaceId, this.id, subscriber.id);
  }

  generateNotifications(
    templateService: TemplateService,
    event: DomainEvent,
    subscriptions: SubscriptionEntity[]
  ) {
    const notifications: Notification[] = [];
    subscriptions.forEach(subscription => {
      if (subscription.shouldSend(event)) {
        const notification = this.generateNotification(templateService, event, subscription);
        
        if (notification) {
          notifications.push(notification);
        }
      }
    })

    return notifications;
  }

  private generateNotification(
    templateService: TemplateService,
    event: DomainEvent, 
    subscription: SubscriptionEntity
  ): Notification {
    const eventNotification = this.getEventNotificationType(event.namespace, event.name);
    const { address, channel } = subscription.getSubscriberChannel(eventNotification);

    return address ? 
      {
        spaceId: this.spaceId,
        typeId: this.id,
        correlationId: event.correlationId,
        to: address,
        channel,
        message: templateService.generateMessage(
          eventNotification.templates[channel], 
          event,
          subscription.subscriber
        )
      } : 
      null;
  }

  getEventNotificationType(namespace: string, name: string) {
    return this.events.find(e => 
      e.namespace === namespace &&
      e.name === name
    );
  }

  delete(user: User) {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to delete notification type.');
    }
    
    return this.repository.delete(this);
  }
}
