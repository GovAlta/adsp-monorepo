import { DomainEvent } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import {  
  EventNotificationType,
  Subscription, 
  SubscriptionCriteria 
} from '../types';
import { SubscriberEntity } from './subscriber';

export class SubscriptionEntity implements Subscription {
  spaceId: string;
  typeId: string;
  criteria: SubscriptionCriteria;
  subscriberId: string;

  static create(
    repository: SubscriptionRepository,
    subscription: Subscription
  ) {
    const entity = new SubscriptionEntity(repository, subscription);
    return repository.saveSubscription(entity);
  }

  constructor(
    private repository: SubscriptionRepository,
    subscription: Subscription,
    public subscriber: SubscriberEntity = null
  ) {
    this.spaceId = subscription.spaceId,
    this.typeId = subscription.typeId;
    this.subscriberId = subscription.subscriberId;
    this.criteria = subscription.criteria || {};
  }

  shouldSend(event: DomainEvent) {
    return event && (
      !this.criteria.correlationId ||
      this.criteria.correlationId === event.correlationId
    );
  }

  getSubscriberChannel(notificationType: EventNotificationType) {
    const channel = this.subscriber ? this.subscriber.channels.find(({channel}) => 
      notificationType.channels.includes(channel)
    ): 
    { address: null, channel: null };

    return channel;
  }
}
