import { AdspId, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import { New, UnauthorizedError, Update } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import { Subscriber, Channel, ServiceUserRoles } from '../types';

export class SubscriberEntity implements Subscriber {
  channels: { channel: Channel; address: string }[] = [];
  userId?: string;
  tenantId: AdspId;
  id: string;
  addressAs: string;

  static canCreate(user: User, subscriber: New<Subscriber>): boolean {
    // User is an subscription admin, or user is creating a subscriber for self.
    return (
      isAllowedUser(user, subscriber.tenantId, [ServiceUserRoles.SubscriptionAdmin], true) ||
      (!!user && user.tenantId?.toString() === subscriber.tenantId.toString() && user?.id === subscriber.userId)
    );
  }

  static async create(
    user: User,
    repository: SubscriptionRepository,
    subscriber: New<Subscriber>
  ): Promise<SubscriberEntity> {
    if (!this.canCreate(user, subscriber)) {
      throw new UnauthorizedError('User not authorized to create subscriber.');
    }

    const entity = new SubscriberEntity(repository, subscriber);
    return repository.saveSubscriber(entity);
  }

  constructor(private repository: SubscriptionRepository, subscriber: Subscriber | New<Subscriber>) {
    const record = subscriber as Subscriber;
    if (record.id) {
      this.id = record.id;
    }

    this.tenantId = subscriber.tenantId;
    this.userId = subscriber.userId;
    this.addressAs = subscriber.addressAs;
    this.channels = subscriber.channels || [];
  }

  canUpdate(user: User): boolean {
    // User is an subscription admin, or is the subscribed user.
    return (
      isAllowedUser(user, this.tenantId, [ServiceUserRoles.SubscriptionAdmin], true) || (!!user && user?.id === this.userId)
    );
  }

  update(user: User, update: Update<Subscriber>): Promise<SubscriberEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update subscriber.');
    }

    if (update.channels) {
      this.channels = update.channels;
    }

    if (update.addressAs) {
      this.addressAs = update.addressAs;
    }

    return this.repository.saveSubscriber(this);
  }

  delete(user: User): Promise<boolean> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to delete subscriber.');
    }

    return this.repository.deleteSubscriber(this);
  }
}
