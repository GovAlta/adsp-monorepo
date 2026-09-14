import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { NotificationConfiguration } from '../configuration';
import { NotificationTypeEntity, SubscriptionEntity, SubscriberEntity } from '../model';
import { SubscriberCriteria, SubscriberSort, SubscriptionSearchCriteria } from '../types';

export interface SubscriptionRepository {
  getSubscriber(tenantId: AdspId, subscriberId: string, byUserId?: boolean): Promise<SubscriberEntity>;

  getSubscription(type: NotificationTypeEntity, subscriberId: string): Promise<SubscriptionEntity>;
  getSubscriptions(
    configuration: NotificationConfiguration,
    tenantId: AdspId,
    top: number,
    after: string,
    criteria: SubscriptionSearchCriteria
  ): Promise<Results<SubscriptionEntity>>;

  findSubscribers(
    top: number,
    after: string,
    criteria: SubscriberCriteria,
    sort?: SubscriberSort
  ): Promise<Results<SubscriberEntity>>;

  saveSubscriber(subscriber: SubscriberEntity): Promise<SubscriberEntity>;
  saveSubscription(subscription: SubscriptionEntity): Promise<SubscriptionEntity>;

  deleteSubscriptions(tenantId: AdspId, typeId: string, subscriberId?: string): Promise<boolean>;
  deleteSubscriber(subscriber: SubscriberEntity): Promise<boolean>;
}
