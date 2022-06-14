import { AdspId, DomainEvent, NotificationType, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { SubscriptionRepository } from '../repository';
import { NotificationTypeEvent, SubscriberChannel, Subscription, SubscriptionCriteria } from '../types';
import { SubscriberEntity } from './subscriber';
import { NotificationTypeEntity } from './type';

export class SubscriptionEntity implements Subscription {
  tenantId: AdspId;
  typeId: string;
  criteria: SubscriptionCriteria;
  subscriberId: string;

  static async create(
    repository: SubscriptionRepository,
    type: NotificationTypeEntity,
    subscriber: SubscriberEntity,
    subscription: Subscription
  ): Promise<SubscriptionEntity> {
    const entity = new SubscriptionEntity(repository, subscription, type, subscriber);
    return repository.saveSubscription(entity);
  }

  constructor(
    private repository: SubscriptionRepository,
    subscription: Subscription,
    public type: NotificationTypeEntity = null,
    public subscriber: SubscriberEntity = null
  ) {
    this.tenantId = subscription.tenantId;
    this.typeId = subscription.typeId;
    this.subscriberId = subscription.subscriberId;
    this.criteria = subscription.criteria || {};
  }

  shouldSend(event: DomainEvent): boolean {
    // truthy event AND correlationId match AND context match
    return (
      !!event &&
      (!this.criteria.correlationId ||
        !!(
          Array.isArray(this.criteria.correlationId) ? this.criteria.correlationId : [this.criteria.correlationId]
        ).find((correlationId) => correlationId === event.correlationId)) &&
      !Object.entries(this.criteria.context || {}).find(([key, value]) => value !== event.context[key])
    );
  }

  getSubscriberChannel(type: NotificationType, event: NotificationTypeEvent): SubscriberChannel {
    const channel = this.subscriber?.channels.find(
      ({ channel }) => type.channels?.includes(channel) && event.templates[channel]
    );
    return channel;
  }

  getSubscriberChannels(type: NotificationType): SubscriberChannel[] {
    if (type.events) {
      const channels = this.subscriber?.channels.filter(({ channel }) => {
        // all events shall have same available templates
        return type.channels?.includes(channel) && type.events[0].templates[channel];
      });
      return channels;
    } else {
      return [];
    }
  }

  updateCriteria(user: User, criteria: SubscriptionCriteria): Promise<SubscriptionEntity> {
    if (!this.type.canSubscribe(user, this.subscriber)) {
      throw new UnauthorizedUserError('update subscription', user);
    }

    this.criteria = criteria;
    return this.repository.saveSubscription(this);
  }
}
