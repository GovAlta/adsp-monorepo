import { SubscriptionEntity } from '../model';
import { NotificationSpace, NotificationType, Subscriber } from '../types';

export const mapSpace = (space: NotificationSpace) => ({
  id: space.id,
  name: space.name,
  spaceAdminRole: space.spaceAdminRole,
});

export const mapSubscriber = (subscriber: Subscriber) => ({
  spaceId: subscriber.spaceId,
  id: subscriber.id,
  addressAs: subscriber.addressAs,
  channels: subscriber.channels,
});

export const mapSubscription = (subscription: SubscriptionEntity) => ({
  subscriber: subscription.subscriber ? mapSubscriber(subscription.subscriber) : null,
  spaceId: subscription.spaceId,
  typeId: subscription.typeId,
  criteria: subscription.criteria,
});

export const mapType = (type: NotificationType) => ({
  spaceId: type.spaceId,
  id: type.id,
  name: type.name,
  description: type.description,
  publicSubscribe: type.publicSubscribe,
  subscriberRoles: type.subscriberRoles,
  events: type.events,
});
