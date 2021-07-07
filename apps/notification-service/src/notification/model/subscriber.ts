import type { AdspId, User } from '@abgov/adsp-service-sdk';
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
    return (
      !!user &&
      (user.isCore || (user.tenantId && `${user.tenantId}` === `${subscriber.tenantId}`)) &&
      (user.roles.includes(ServiceUserRoles.SubscriptionAdmin) || subscriber.userId === user.id)
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

    const entity = new SubscriberEntity(repository, { ...subscriber, tenantId: user.tenantId || subscriber.tenantId });
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
    return (
      user &&
      (user.isCore || (user.tenantId && `${user.tenantId}` === `${this.tenantId}`)) &&
      (user.roles.includes(ServiceUserRoles.SubscriptionAdmin) || (this.userId && user.id === this.userId))
    );
  }

  async update(user: User, update: Update<Subscriber>): Promise<SubscriberEntity> {
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
}
