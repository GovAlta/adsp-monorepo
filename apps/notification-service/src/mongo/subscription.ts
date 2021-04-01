import { decodeAfter, Doc, encodeNext, Results } from '@core-services/core-common';
import { model, Types } from 'mongoose';
import {
  NotificationTypeEntity,
  Subscriber,
  SubscriberCriteria,
  SubscriberEntity,
  Subscription,
  SubscriptionEntity,
  SubscriptionRepository,
} from '../notification';
import { subscriberSchema, subscriptionSchema } from './schema';

export class MongoSubscriptionRepository implements SubscriptionRepository {
  private subscriberModel;
  private subscriptionModel;

  constructor() {
    this.subscriberModel = model('subscriber', subscriberSchema);
    this.subscriptionModel = model('subscription', subscriptionSchema);
  }

  getSubscriber(subscriberId: string): Promise<SubscriberEntity> {
    return new Promise<SubscriberEntity>((resolve, reject) =>
      this.subscriberModel.findOne({ _id: subscriberId }, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  getSubscription(type: NotificationTypeEntity, subscriberId: string) {
    return new Promise<SubscriptionEntity>((resolve, reject) =>
      this.subscriptionModel
        .findOne(
          {
            spaceId: type.spaceId,
            typeId: type.id,
            subscriberId,
          },
          null,
          { lean: true }
        )
        .populate('subscriberId')
        .exec((err, doc) => (err ? reject(err) : resolve(this.fromSubscriptionDoc(doc))))
    );
  }

  getSubscriptions(type: NotificationTypeEntity, top: number, after: string): Promise<Results<SubscriptionEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<SubscriptionEntity>>((resolve, reject) => {
      this.subscriptionModel
        .find({ spaceId: type.spaceId, typeId: type.id }, null, { lean: true })
        .populate('subscriberId')
        .skip(skip)
        .limit(top)
        .exec((err, docs) =>
          err
            ? reject(err)
            : resolve({
                results: docs.map((doc) => this.fromSubscriptionDoc(doc)),
                page: {
                  after,
                  next: encodeNext(docs.length, top, skip),
                  size: docs.length,
                },
              })
        );
    });
  }

  findSubscribers(top: number, after: string, criteria: SubscriberCriteria): Promise<Results<SubscriberEntity>> {
    const skip = decodeAfter(after);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (criteria.spaceIdEquals) {
      query.spaceId = criteria.spaceIdEquals;
    }

    return new Promise<Results<SubscriberEntity>>((resolve, reject) => {
      this.subscriberModel
        .find(query, null, { lean: true })
        .skip(skip)
        .limit(top)
        .exec((err, docs) =>
          err
            ? reject(err)
            : resolve({
                results: docs.map((doc) => this.fromDoc(doc)),
                page: {
                  after,
                  next: encodeNext(docs.length, top, skip),
                  size: docs.length,
                },
              })
        );
    });
  }

  saveSubscriber(subscriber: SubscriberEntity): Promise<SubscriberEntity> {
    return new Promise<SubscriberEntity>((resolve, reject) =>
      this.subscriberModel.findOneAndUpdate(
        { _id: subscriber.id || new Types.ObjectId() },
        this.toDoc(subscriber),
        { upsert: true, new: true, lean: true },
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.fromDoc(doc));
          }
        }
      )
    );
  }

  saveSubscription(subscription: SubscriptionEntity): Promise<SubscriptionEntity> {
    return new Promise<SubscriptionEntity>((resolve, reject) =>
      this.subscriptionModel.findOneAndUpdate(
        {
          spaceId: subscription.spaceId,
          typeId: subscription.typeId,
          subscriberId: subscription.subscriberId,
        },
        this.toSubscriptionDoc(subscription),
        { upsert: true, new: true, lean: true },
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.fromSubscriptionDoc(doc));
          }
        }
      )
    );
  }

  deleteSubscriptions(spaceId: string, typeId: string, subscriberId: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (spaceId && typeId) {
      query.spaceId = spaceId;
      query.typeId = typeId;
    }

    if (subscriberId) {
      query.subscriberId = subscriberId;
    }

    return this.subscriptionModel.deleteMany(query).then(({ deletedCount }) => deletedCount > 0);
  }

  deleteSubscriber(subscriber: SubscriberEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.subscriberModel.findOneAndDelete({ _id: subscriber.id }, (err, doc) => (err ? reject(err) : resolve(!!doc)))
    ).then((deleted) =>
      deleted ? this.deleteSubscriptions(null, null, subscriber.id).then(() => deleted) : Promise.resolve(deleted)
    );
  }

  private fromDoc(doc: Doc<Subscriber>) {
    return doc
      ? new SubscriberEntity(this, {
          spaceId: doc.spaceId,
          userId: doc.userId,
          id: `${doc._id}`,
          addressAs: doc.addressAs,
          channels: doc.channels,
        })
      : null;
  }

  private fromSubscriptionDoc(doc: Doc<Subscription>) {
    return doc
      ? new SubscriptionEntity(
          this,
          {
            spaceId: doc.spaceId,
            typeId: doc.typeId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            subscriberId: `${((doc.subscriberId as any) || {})._id || doc.subscriberId}`,
            criteria: doc.criteria,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((doc.subscriberId as any) || {})._id
            ? new SubscriberEntity(this, this.fromDoc((doc.subscriberId as unknown) as Doc<Subscriber>))
            : null
        )
      : null;
  }

  private toDoc(entity: SubscriberEntity): Doc<Subscriber> {
    return {
      spaceId: entity.spaceId,
      addressAs: entity.addressAs,
      userId: entity.userId,
      channels: entity.channels,
    };
  }

  private toSubscriptionDoc(entity: SubscriptionEntity): Subscription {
    return {
      spaceId: entity.spaceId,
      typeId: entity.typeId,
      subscriberId: entity.subscriberId,
      criteria: entity.criteria,
    };
  }
}
