import { Results } from '@core-services/core-common';
import { NotificationTypeEntity, SubscriptionEntity, SubscriberEntity } from '../model';
import { SubscriberCriteria } from '../types';

export interface SubscriptionRepository {
  getSubscriber(subscriberId: string): Promise<SubscriberEntity>;

  getSubscription(type: NotificationTypeEntity, subscriberId: string): Promise<SubscriptionEntity>;
  getSubscriptions(type: NotificationTypeEntity, top: number, after: string): Promise<Results<SubscriptionEntity>>;

  findSubscribers(top: number, after: string, criteria: SubscriberCriteria): Promise<Results<SubscriberEntity>>;

  saveSubscriber(subscriber: SubscriberEntity): Promise<SubscriberEntity>;
  saveSubscription(subscription: SubscriptionEntity): Promise<SubscriptionEntity>;
  deleteSubscriptions(spaceId: string, typeId: string, subscriberId?: string): Promise<boolean>;
  deleteSubscriber(subscriber: SubscriberEntity): Promise<boolean>;
}
