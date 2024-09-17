import { AdspId, DomainEvent, NotificationType, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import { NotificationTypeEvent, SubscriberChannel, Subscription, SubscriptionCriteria } from '../types';
import { SubscriberEntity } from './subscriber';
import { NotificationTypeEntity } from './type';

export class SubscriptionEntity implements Subscription {
  tenantId: AdspId;
  typeId: string;
  criteria: SubscriptionCriteria[];
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
    this.criteria = subscription.criteria
      ? Array.isArray(subscription.criteria)
        ? subscription.criteria
        : [subscription.criteria]
      : [{}];
  }

  private evaluateCriteria(event: DomainEvent | SubscriptionCriteria, criteria: SubscriptionCriteria): boolean {
    const eventCorrelationId = event.correlationId?.substring(event.correlationId?.lastIndexOf('/') + 1);

    return (
      (!criteria?.correlationId || criteria.correlationId === eventCorrelationId) &&
      !Object.entries(criteria.context || {}).find(([key, value]) => value !== event.context?.[key])
    );
  }

  // NOTE: Due to legacy schema design multiple subscriptions to the same notification type is represented as a single subscription
  // with all collection of criteria where each represents a criteria to a specific context (e.g. form ID).
  //
  shouldSend(event: DomainEvent): boolean {
    // truthy event AND correlationId match AND context match
    return !!(event && this.criteria.find((criteria) => this.evaluateCriteria(event, criteria)));
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

  private isEmptyCriteria(criteria: SubscriptionCriteria): boolean {
    return !criteria?.correlationId && Object.entries(criteria?.context || {}).length < 1;
  }

  async updateCriteria(
    user: User,
    criteria: SubscriptionCriteria | SubscriptionCriteria[]
  ): Promise<SubscriptionEntity> {
    if (!this.type.canSubscribe(user, this.subscriber)) {
      throw new UnauthorizedUserError('update subscription', user);
    }

    if (Array.isArray(criteria)) {
      if (!criteria.length) {
        // Unfortunately the intent of the requester is ambiguous if they specify an empty array.
        // It could either mean unsubscribe fully, or make the criteria unrestricted.
        throw new InvalidOperationError(
          'Cannot set criteria to an empty array. ' +
            'Delete the subscription to unsubscribe from all notifications on the type; ' +
            'otherwise, include an empty criteria to subscribe to all notifications on type.'
        );
      }

      this.criteria = criteria;
    } else {
      // Add the criteria. This means the subscription will send for events that meet the new criteria as well as other
      // pre-existing criteria. e.g. this is used in forms where a subscriber can be subscribed to notifications on multiple
      // specific forms.
      this.criteria.push({
        description: criteria.description,
        correlationId: criteria.correlationId,
        context: criteria.context,
      });
    }

    // If after the update we have more than one criteria object and at least one is an empty criteria then throw.
    // This configuration 'works' but is likely indicating a bad configuration, since effectively the more specific criteria
    // are overridden by the empty criteria.
    if (this.criteria.find((criteria) => this.isEmptyCriteria(criteria)) && this.criteria.length !== 1) {
      throw new InvalidOperationError(
        'This subscription has multiple criteria objects including an empty criteria which will always send when triggered. ' +
          'Update the array of criteria to remove extraneous criteria.'
      );
    }

    return this.repository.saveSubscription(this);
  }

  async deleteCriteria(user: User, toDelete: SubscriptionCriteria): Promise<[boolean, boolean]> {
    if (!this.type.canSubscribe(user, this.subscriber)) {
      throw new UnauthorizedUserError('update subscription', user);
    }

    if (this.isEmptyCriteria(toDelete)) {
      throw new InvalidOperationError(
        'Cannot remove criteria based on an empty criteria. Delete the subscription to unsubscribe from all notifications on the type.'
      );
    }

    let hasUpdate = false;

    // Build a collection of criteria objects that are being retained to determine the update.
    const keep: SubscriptionCriteria[] = [];
    this.criteria.forEach((item) => {
      // Keep an item if it's not a match to the delete criteria.
      if (!this.evaluateCriteria(item, toDelete)) {
        keep.push(item);
      } else {
        hasUpdate = true;
      }
    });

    let subscriptionDeleted = false;
    if (hasUpdate) {
      if (keep.length === 0) {
        // Delete the subscription entirely if no criteria objects remain.
        subscriptionDeleted = await this.repository.deleteSubscriptions(this.tenantId, this.typeId, this.subscriberId);
      } else {
        this.criteria = (await this.updateCriteria(user, keep)).criteria;
      }
    }

    return [hasUpdate, subscriptionDeleted];
  }
}
