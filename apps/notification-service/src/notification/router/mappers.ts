import { NotificationTypeEntity, SubscriberEntity, SubscriptionEntity } from '../model';
import { NotificationType } from '../types';

export const mapSubscriber = (subscriber: SubscriberEntity): unknown => ({
  id: subscriber.id,
  addressAs: subscriber.addressAs,
  channels: subscriber.channels,
  userId: subscriber.userId,
});

export const mapSubscription = (subscription: SubscriptionEntity): unknown => ({
  subscriber: subscription.subscriber ? mapSubscriber(subscription.subscriber) : null,
  typeId: subscription.typeId,
  criteria: subscription.criteria,
});

export const mapType = (type: NotificationTypeEntity): NotificationType => ({
  id: type.id,
  name: type.name,
  description: type.description,
  publicSubscribe: type.publicSubscribe,
  subscriberRoles: type.subscriberRoles,
  events: type.events,
});
