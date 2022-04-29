import { AdspId, Channel, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, New, UnauthorizedError, Update } from '@core-services/core-common';
import { VerifyService } from '../verify';
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
      isAllowedUser(
        user,
        subscriber.tenantId,
        [ServiceUserRoles.SubscriptionAdmin, ServiceUserRoles.SubscriptionApp],
        true
      ) ||
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
      isAllowedUser(
        user,
        this.tenantId,
        [ServiceUserRoles.SubscriptionAdmin, ServiceUserRoles.SubscriptionApp],
        true
      ) ||
      (!!user && user?.id === this.userId)
    );
  }

  update(user: User, update: Update<Subscriber>): Promise<SubscriberEntity> {
    if (!this.canUpdate(user)) {
      throw new UnauthorizedError('User not authorized to update subscriber.');
    }

    if (update.channels) {
      // Retain verified status for matching channel/address values.
      this.channels = update.channels.map(({ channel, address }) => ({
        channel,
        address,
        verified: this.channels.find((c) => c.channel === channel && c.address === address)?.verified || false,
      }));
    }

    if (update.addressAs !== null) {
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

  async sendVerifyCode(
    verifyService: VerifyService,
    user: User,
    channel: Channel,
    address: string,
    reason: string = null
  ): Promise<void> {
    if (!this.canUpdate(user) && !isAllowedUser(user, this.tenantId, ServiceUserRoles.CodeSender, true)) {
      throw new UnauthorizedUserError('send code to subscriber', user);
    }

    const verifyChannel = this.channels.find((sub) => sub.channel === channel && sub.address === address);
    if (!verifyChannel) {
      throw new InvalidOperationError('Specified subscriber channel not recognized.');
    }

    verifyChannel.verifyKey = await verifyService.sendCode(
      verifyChannel,
      reason || 'Enter this code to verify your contact address.'
    );
    await this.repository.saveSubscriber(this);
  }

  async checkVerifyCode(
    verifyService: VerifyService,
    user: User,
    channel: Channel,
    address: string,
    code: string,
    verifyChannel?: boolean
  ): Promise<boolean> {
    if (
      !this.canUpdate(user) &&
      (verifyChannel || !isAllowedUser(user, this.tenantId, ServiceUserRoles.CodeSender, true))
    ) {
      throw new UnauthorizedUserError('verify code', user);
    }

    const codeChannel = this.channels.find((sub) => sub.channel === channel && sub.address === address);
    if (!codeChannel) {
      throw new InvalidOperationError('Specified subscriber channel not recognized.');
    }

    const verified = await verifyService.verifyCode(codeChannel, code);
    if (verifyChannel) {
      codeChannel.verified = verified;
      await this.repository.saveSubscriber(this);
    }

    return verified;
  }
}
