import { adspId, AdspId } from '@abgov/adsp-service-sdk';
import { NotificationTypeEntity, SubscriberEntity, SubscriptionEntity } from '../model';
import { NotificationType } from '../types';

export const mapSubscriber = (apiId: AdspId, subscriber: SubscriberEntity): unknown => ({
  id: subscriber.id,
  urn: adspId`${apiId}:/subscribers/${subscriber.id}`.toString(),
  addressAs: subscriber.addressAs,
  channels: subscriber.channels?.map((c) => ({
    channel: c.channel,
    address: c.address,
    verified: c.verified,
  })),
  userId: subscriber.userId,
});

export const mapSubscription = (apiId: AdspId, subscription: SubscriptionEntity): Record<string, unknown> => ({
  subscriber: subscription.subscriber ? mapSubscriber(apiId, subscription.subscriber) : null,
  subscriberId: subscription.subscriberId,
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
