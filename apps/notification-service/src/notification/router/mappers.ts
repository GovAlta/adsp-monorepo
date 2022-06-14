import { adspId, AdspId } from '@abgov/adsp-service-sdk';
import { NotificationTypeEntity, SubscriberEntity, SubscriptionEntity } from '../model';

export const mapSubscriber = (apiId: AdspId, subscriber: SubscriberEntity): Record<string, unknown> => ({
  tenantId: subscriber.tenantId?.toString(),
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

export const mapSubscription = (
  apiId: AdspId,
  subscription: SubscriptionEntity,
  includeType = false
): Record<string, unknown> => ({
  subscriber: subscription.subscriber ? mapSubscriber(apiId, subscription.subscriber) : null,
  subscriberId: subscription.subscriberId,
  typeId: subscription.typeId,
  criteria: subscription.criteria,
  type: includeType ? mapType(subscription.type, true) : undefined,
});

export const mapType = (type: NotificationTypeEntity, lean?: boolean): Record<string, unknown> =>
  type
    ? lean
      ? {
          id: type.id,
          name: type.name,
          description: type.description,
          publicSubscribe: type.publicSubscribe,
          manageSubscribe: type.manageSubscribe,
          channels: type.channels,
        }
      : {
          id: type.id,
          name: type.name,
          description: type.description,
          publicSubscribe: type.publicSubscribe,
          manageSubscribe: type.manageSubscribe,
          subscriberRoles: type.subscriberRoles,
          channels: type.channels,
          events: type.events,
        }
    : null;
