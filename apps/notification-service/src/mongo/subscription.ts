import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, Results } from '@core-services/core-common';
import { model, Types } from 'mongoose';
import {
  NotificationTypeEntity,
  SubscriberCriteria,
  SubscriberEntity,
  SubscriptionEntity,
  SubscriptionRepository,
  SubscriptionSearchCriteria,
} from '../notification';
import { subscriberSchema, subscriptionSchema } from './schema';
import { SubscriberDoc, SubscriptionDoc } from './types';

export class MongoSubscriptionRepository implements SubscriptionRepository {
  private subscriberModel;
  private subscriptionModel;

  constructor() {
    this.subscriberModel = model('subscriber', subscriberSchema);
    this.subscriptionModel = model('subscription', subscriptionSchema);
  }

  getSubscriber(tenantId: AdspId, subscriberId: string, byUserId = false): Promise<SubscriberEntity> {
    const criteria: Record<string, string> = {
      tenantId: tenantId?.toString(),
    };

    if (!byUserId) {
      criteria._id = subscriberId;
    } else {
      criteria.userId = subscriberId;
    }

    return new Promise<SubscriberEntity>((resolve, reject) =>
      this.subscriberModel.findOne(criteria, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  getSubscriberByEmail(tenantId: AdspId, email: string): Promise<SubscriberEntity> {
    const criteria: Record<string, string> = {
      tenantId: tenantId?.toString(),
      addressAs: email,
    };

    return new Promise<SubscriberEntity>((resolve, reject) =>
      this.subscriberModel.findOne(criteria, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  getSubscription(type: NotificationTypeEntity, subscriberId: string): Promise<SubscriptionEntity> {
    return new Promise<SubscriptionEntity>((resolve, reject) =>
      this.subscriptionModel
        .findOne(
          {
            tenantId: type.tenantId?.toString(),
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

  getSubscriptions(
    tenantId: AdspId,
    top: number,
    after: string,
    criteria: SubscriptionSearchCriteria
  ): Promise<Results<SubscriptionEntity>> {
    const skip = decodeAfter(after);

    const query: Record<string, unknown> = {
      tenantId: tenantId?.toString(),
    };

    if (criteria?.typeIdEquals) {
      query.typeId = criteria.typeIdEquals;
    }

    if (criteria?.subscriberIdEquals) {
      query.subscriberId = criteria.subscriberIdEquals;
    }

    return new Promise<Results<SubscriptionEntity>>((resolve, reject) => {
      this.subscriptionModel
        .find(query, null, { lean: true })
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
    if (criteria.tenantIdEquals) {
      query.tenantId = criteria.tenantIdEquals.toString();
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
          tenantId: subscription.tenantId.toString(),
          typeId: subscription.typeId,
          subscriberId: subscription.subscriberId,
        },
        this.toSubscriptionDoc(subscription),
        { upsert: true, new: true, lean: true },
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.fromSubscriptionDoc(doc, subscription.subscriber));
          }
        }
      )
    );
  }

  deleteSubscriptions(tenantId: AdspId, typeId: string, subscriberId: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (tenantId && typeId) {
      query.tenantId = tenantId.toString();
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

  private fromDoc(doc: SubscriberDoc) {
    return doc
      ? new SubscriberEntity(this, {
          tenantId: AdspId.parse(doc.tenantId),
          userId: doc.userId,
          id: `${doc._id}`,
          addressAs: doc.addressAs,
          channels:
            doc.channels?.map((c) => ({
              channel: c.channel,
              address: c.address,
              verified: !!c.verified,
              verifyKey: c.verifyKey,
            })) || [],
        })
      : null;
  }

  private fromSubscriptionDoc(doc: SubscriptionDoc, subscriber?: SubscriberEntity) {
    return doc
      ? new SubscriptionEntity(
          this,
          {
            tenantId: AdspId.parse(doc.tenantId),
            typeId: doc.typeId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            subscriberId: `${((doc.subscriberId as any) || {})._id || doc.subscriberId}`,
            criteria: doc.criteria,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subscriber ||
            (doc.subscriberId?.['tenantId']
              ? new SubscriberEntity(this, this.fromDoc(doc.subscriberId as unknown as SubscriberDoc))
              : null)
        )
      : null;
  }

  private toDoc(entity: SubscriberEntity): SubscriberDoc {
    const doc: SubscriberDoc = {
      tenantId: entity.tenantId.toString(),
      addressAs: entity.addressAs,
      channels: entity.channels,
    };

    // Only include userId property if there is a value; this is for the parse unique index.
    if (entity.userId) {
      doc.userId = entity.userId;
    }

    return doc;
  }

  private toSubscriptionDoc(entity: SubscriptionEntity): SubscriptionDoc {
    return {
      tenantId: entity.tenantId.toString(),
      typeId: entity.typeId,
      subscriberId: entity.subscriberId,
      criteria: entity.criteria,
    };
  }
}
