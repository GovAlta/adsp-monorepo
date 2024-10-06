import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, Results } from '@core-services/core-common';
import { Document, model, Model, PipelineStage, Types } from 'mongoose';
import { Logger } from 'winston';
import {
  NotificationConfiguration,
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
  private subscriberModel: Model<Document & SubscriberDoc>;
  private subscriptionModel: Model<Document & SubscriptionDoc>;

  constructor(private logger: Logger) {
    this.subscriberModel = model<Document & SubscriberDoc>('subscriber', subscriberSchema);
    this.subscriptionModel = model<Document & SubscriptionDoc>('subscription', subscriptionSchema);

    const handleIndexError = (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    };
    this.subscriberModel.on('index', handleIndexError);
    this.subscriptionModel.on('index', handleIndexError);
  }

  async getSubscriber(tenantId: AdspId, subscriberId: string, byUserId = false): Promise<SubscriberEntity> {
    const criteria: Record<string, string> = {};

    if (tenantId) {
      criteria.tenantId = tenantId.toString();
    }

    if (!byUserId) {
      criteria._id = subscriberId;
    } else {
      criteria.userId = subscriberId;
    }

    const doc = await this.subscriberModel.findOne(criteria, null, { lean: true });
    return this.fromDoc(doc);
  }

  async getSubscription(type: NotificationTypeEntity, subscriberId: string): Promise<SubscriptionEntity> {
    const doc = await this.subscriptionModel
      .findOne(
        {
          tenantId: type.tenantId?.toString(),
          typeId: type.id,
          subscriberId,
        },
        null,
        { lean: true }
      )
      .populate('subscriberId');

    return this.fromSubscriptionDoc(doc, type);
  }

  async getSubscriptions(
    configuration: NotificationConfiguration,
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
      query.subscriberId = new Types.ObjectId(criteria.subscriberIdEquals);
    }

    if (criteria?.subscriptionMatch) {
      // Subscription criteria match happens if either:
      // 1. the subscription specifies a property value that equals the value of the associated property in the event; or
      // 2. the subscription does not specify a criteria (i.e. the subscription applies across all values of the property.)
      const criteriaQuery: Record<string, unknown> = {};
      // This is to support old subscriptions where the criteria is stored as a sub document not in an array.
      const backCompatQuery: Record<string, unknown> = {};

      if (criteria.subscriptionMatch.correlationId) {
        criteriaQuery.correlationId = {
          $in: [null, criteria.subscriptionMatch.correlationId],
        };
        backCompatQuery['criteria.correlationId'] = criteriaQuery.correlationId;
      }

      if (criteria.subscriptionMatch.context) {
        Object.entries(criteria.subscriptionMatch.context).forEach(([key, value]) => {
          // Allow falsy values other than undefined and null.
          if (value !== undefined && value !== null) {
            criteriaQuery[`context.${key}`] = { $in: [null, value] };
            backCompatQuery[`criteria.context.${key}`] = { $in: [null, value] };
          }
        });
      }

      query.$or = [{ criteria: null }, { criteria: { $elemMatch: criteriaQuery } }, backCompatQuery];
    }

    const pipeline: PipelineStage[] = [
      { $match: query },
      {
        $lookup: {
          from: 'subscribers',
          localField: 'subscriberId',
          foreignField: '_id',
          as: 'subscriberId',
        },
      },
    ];

    if (criteria.subscriberCriteria) {
      const subscriberQuery: Record<string, unknown> = {};
      if (criteria.subscriberCriteria.name) {
        subscriberQuery.addressAs = { $regex: criteria.subscriberCriteria.name, $options: 'i' };
      }

      if (criteria.subscriberCriteria.sms) {
        if (criteria.subscriberCriteria.email) {
          subscriberQuery.channels = {
            $all: [
              { $elemMatch: { channel: 'sms', address: { $regex: criteria.subscriberCriteria.sms } } },
              {
                $elemMatch: {
                  channel: 'email',
                  address: { $regex: criteria.subscriberCriteria.email.toLocaleLowerCase() },
                },
              },
            ],
          };
        } else {
          subscriberQuery.channels = {
            $elemMatch: { channel: 'sms', address: { $regex: criteria.subscriberCriteria.sms } },
          };
        }
      } else if (criteria.subscriberCriteria.email) {
        subscriberQuery.channels = {
          $elemMatch: { channel: 'email', address: { $regex: criteria.subscriberCriteria.email.toLocaleLowerCase() } },
        };
      }

      pipeline.push({
        $match: {
          subscriberId: {
            $elemMatch: subscriberQuery,
          },
        },
      });
    }

    pipeline.push({
      $unwind: '$subscriberId',
    });

    const mongoQuery = this.subscriptionModel.aggregate(pipeline).skip(skip);
    if (top > 0) {
      mongoQuery.limit(top);
    }

    const docs: SubscriptionDoc[] = await mongoQuery.exec();

    return {
      results: docs.map((doc) => this.fromSubscriptionDoc(doc, configuration.getNotificationType(doc.typeId))),
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    };
  }

  async findSubscribers(top: number, after: string, criteria: SubscriberCriteria): Promise<Results<SubscriberEntity>> {
    const skip = decodeAfter(after);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (criteria.tenantIdEquals) {
      query.tenantId = criteria.tenantIdEquals.toString();
    }

    if (criteria.name) {
      query.addressAs = { $regex: criteria.name, $options: 'i' };
    }

    if (criteria.sms) {
      if (criteria.email) {
        query.channels = {
          $all: [
            { $elemMatch: { channel: 'sms', address: { $regex: criteria.sms } } },
            { $elemMatch: { channel: 'email', address: { $regex: criteria.email.toLocaleLowerCase() } } },
          ],
        };
      } else {
        query.channels = { $elemMatch: { channel: 'sms', address: { $regex: criteria.sms } } };
      }
    } else if (criteria.email) {
      query.channels = { $elemMatch: { channel: 'email', address: { $regex: criteria.email.toLocaleLowerCase() } } };
    }

    const docs = await this.subscriberModel.find(query, null, { lean: true }).skip(skip).limit(top).exec();
    return {
      results: docs.map((doc) => this.fromDoc(doc)),
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    };
  }

  async saveSubscriber(subscriber: SubscriberEntity): Promise<SubscriberEntity> {
    const doc = await this.subscriberModel.findOneAndUpdate(
      { _id: subscriber.id || new Types.ObjectId() },
      this.toDoc(subscriber),
      { upsert: true, new: true, lean: true }
    );

    return this.fromDoc(doc);
  }

  async saveSubscription(subscription: SubscriptionEntity): Promise<SubscriptionEntity> {
    const doc = await this.subscriptionModel.findOneAndUpdate(
      {
        tenantId: subscription.tenantId.toString(),
        typeId: subscription.typeId,
        subscriberId: subscription.subscriberId,
      },
      this.toSubscriptionDoc(subscription),
      { upsert: true, new: true, lean: true }
    );

    return this.fromSubscriptionDoc(doc, subscription.type, subscription.subscriber);
  }

  async deleteSubscriptions(tenantId: AdspId, typeId: string, subscriberId: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (tenantId && typeId) {
      query.tenantId = tenantId.toString();
      query.typeId = typeId;
    }

    if (subscriberId) {
      query.subscriberId = subscriberId;
    }

    const { deletedCount } = await this.subscriptionModel.deleteMany(query);
    return deletedCount > 0;
  }

  async deleteSubscriber(subscriber: SubscriberEntity): Promise<boolean> {
    const deleted = !!(await this.subscriberModel.findOneAndDelete({ _id: subscriber.id }));
    if (deleted) {
      await this.deleteSubscriptions(null, null, subscriber.id);
    }

    return deleted;
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
              pendingVerification: c.pendingVerification,
              timeCodeSent: c.timeCodeSent,
            })) || [],
        })
      : null;
  }

  private fromSubscriptionDoc(doc: SubscriptionDoc, type: NotificationTypeEntity, subscriber?: SubscriberEntity) {
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
          type,
          subscriber ||
            ((doc.subscriberId as SubscriberDoc)?.tenantId
              ? new SubscriberEntity(this, this.fromDoc(doc.subscriberId as SubscriberDoc))
              : null)
        )
      : null;
  }

  private toDoc(entity: SubscriberEntity): SubscriberDoc {
    const doc: SubscriberDoc = {
      tenantId: entity.tenantId.toString(),
      addressAs: entity.addressAs,
      channels: entity.channels.map((c) => {
        if (c.channel === 'email') {
          c.address = c.address.toLocaleLowerCase();
        }
        return c;
      }),
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
      criteria: entity.criteria?.map((criteria) => ({
        description: criteria?.description,
        correlationId: criteria?.correlationId,
        context: criteria?.context,
      })),
    };
  }
}
