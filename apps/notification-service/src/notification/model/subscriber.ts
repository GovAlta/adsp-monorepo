import { AdspId, Channel, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, New, UnauthorizedError, Update } from '@core-services/core-common';
import { VerifyService } from '../../verify';
import { SubscriptionRepository } from '../repository';
import { Subscriber, ServiceUserRoles, SubscriberChannel } from '../types';

export class SubscriberEntity implements Subscriber {
  channels: SubscriberChannel[] = [];
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
      isAllowedUser(user, this.tenantId, [ServiceUserRoles.SubscriptionAdmin], true) ||
      (!!user && user?.id === this.userId)
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

  async startVerifyCode(
    verifyService: VerifyService,
    user: User,
    channel: Channel,
    address: string
  ): Promise<SubscriberEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update subscriber.');
    }

    const verifyChannel = this.channels.find((sub) => sub.channel === channel && sub.address === address);
    if (!verifyChannel) {
      throw new InvalidOperationError('Specified subscriber channel not recognized.');
    }

    verifyChannel.verifyKey = await verifyService.sendCode(
      verifyChannel,
      'Enter this code to verify your contact address.'
    );
    return await this.repository.saveSubscriber(this);
  }

  async verifyChannel(
    verifyService: VerifyService,
    user: User,
    channel: Channel,
    address: string,
    code: string
  ): Promise<SubscriberEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update subscriber.');
    }

    const verifyChannel = this.channels.find((sub) => sub.channel === channel && sub.address === address);
    if (!verifyChannel) {
      throw new InvalidOperationError('Specified subscriber channel not recognized.');
    }

    verifyChannel.verified = await verifyService.verifyCode(verifyChannel, code);
    if (verifyChannel.verified) {
      // Clear the key if the channel was verified; otherwise retain so user can retry.
      verifyChannel.verifyKey = null;
    }

    return await this.repository.saveSubscriber(this);
  }
}
