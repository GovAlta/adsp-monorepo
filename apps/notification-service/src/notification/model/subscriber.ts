import type { User } from '@abgov/adsp-service-sdk';
import { New, UnauthorizedError, Update } from '@core-services/core-common';
import { SubscriptionRepository } from '../repository';
import { Subscriber, Channel } from '../types';

export class SubscriberEntity implements Subscriber {
  channels: { channel: Channel; address: string }[] = [];
  userId?: string;
  spaceId: string;
  id: string;
  addressAs: string;

  static create(repository: SubscriptionRepository, subscriber: New<Subscriber>) {
    const entity = new SubscriberEntity(repository, subscriber);
    return repository.saveSubscriber(entity);
  }

  constructor(private repository: SubscriptionRepository, subscriber: Subscriber | New<Subscriber>) {
    const record = subscriber as Subscriber;
    if (record.id) {
      this.id = record.id;
    }

    this.spaceId = subscriber.spaceId;
    this.userId = subscriber.userId;
    this.addressAs = subscriber.addressAs;
    this.channels = subscriber.channels || [];
  }

  canUpdate(user: User) {
    return user && this.userId && user.id === this.userId;
  }

  update(user: User, update: Update<Subscriber>) {
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
