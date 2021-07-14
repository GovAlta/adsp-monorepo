import { NotificationTypeEntity, SubscriberEntity, SubscriptionEntity } from '../model';
import { NotificationType, Subscriber, Subscription } from '../types';

export const mapSubscriber = (subscriber: SubscriberEntity): Subscriber => ({
  tenantId: subscriber.tenantId,
  id: subscriber.id,
  addressAs: subscriber.addressAs,
  channels: subscriber.channels,
  userId: subscriber.userId,
});

export const mapSubscription = (
  subscription: SubscriptionEntity
): Omit<Subscription, 'subscriberId'> & { subscriber: Subscriber } => ({
  subscriber: subscription.subscriber ? mapSubscriber(subscription.subscriber) : null,
  tenantId: subscription.tenantId,
  typeId: subscription.typeId,
  criteria: subscription.criteria,
});

export const mapType = (type: NotificationTypeEntity): NotificationType => ({
  id: type.id,
  name: type.name,
  description: type.description,
  subscriberRoles: type.subscriberRoles,
  events: type.events,
});
