import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { NotificationTypeEntity, SubscriptionEntity, SubscriberEntity } from '../model';
import { SubscriberCriteria, SubscriptionSearchCriteria } from '../types';

export interface SubscriptionRepository {
  getSubscriber(tenantId: AdspId, subscriberId: string, byUserId?: boolean): Promise<SubscriberEntity>;

  getSubscription(type: NotificationTypeEntity, subscriberId: string): Promise<SubscriptionEntity>;
  getSubscriptions(
    tenantId: AdspId,
    top: number,
    after: string,
    criteria: SubscriptionSearchCriteria
  ): Promise<Results<SubscriptionEntity>>;

  findSubscribers(top: number, after: string, criteria: SubscriberCriteria): Promise<Results<SubscriberEntity>>;

  saveSubscriber(subscriber: SubscriberEntity): Promise<SubscriberEntity>;
  saveSubscription(subscription: SubscriptionEntity): Promise<SubscriptionEntity>;

  deleteSubscriptions(tenantId: AdspId, typeId: string, subscriberId?: string): Promise<boolean>;
  deleteSubscriber(subscriber: SubscriberEntity): Promise<boolean>;
}
