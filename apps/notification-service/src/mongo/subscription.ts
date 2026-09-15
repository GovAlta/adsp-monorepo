import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, Results } from '@core-services/core-common';
import { Document, model, Model, PipelineStage, Types } from 'mongoose';
import { Logger } from 'winston';
import {
  NotificationConfiguration,
  NotificationTypeEntity,
  SubscriberCriteria,
  SubscriberEntity,
  SubscriberSort,
  SubscriptionEntity,
  SubscriptionRepository,
  SubscriptionSearchCriteria,
} from '../notification';
import { subscriberSchema, subscriptionSchema } from './schema';
import { SubscriberDoc, SubscriptionDoc } from './types';

function toIdTimestamp(id: SubscriberDoc['_id']): Date {
  return id && Types.ObjectId.isValid(id) ? new Types.ObjectId(id).getTimestamp() : null;
}

// Azure Cosmos DB's Mongo API refuses an ORDER BY it has no matching composite index for, with this
// message, instead of degrading to an in-memory sort the way a self-hosted MongoDB would.
function isUnservedSortError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('does not have a corresponding composite index');
}

// Search values are matched as a substring of the field. They come from the user, so escape the
// characters a regular expression would otherwise read as syntax; without this a value like "(" is
// not a fruitless search but a malformed expression that the database rejects.
function toContains(value: string): { $regex: string; $options: string } {
  return { $regex: value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
}

// Picks the address of the first channel of a kind, as the sort key for the column showing it.
function toChannelAddressKey(channel: string): PipelineStage.AddFields['$addFields'] {
  return {
    _sortKey: {
      $arrayElemAt: [
        {
          $map: {
            input: { $filter: { input: '$channels', as: 'c', cond: { $eq: ['$$c.channel', channel] } } },
            as: 'c',
            in: '$$c.address',
          },
        },
        0,
      ],
    },
  };
}

// The address and verification columns read out of the channels array rather than a field of the
// subscriber, so sorting on them needs a key computed first. The remaining columns sort on their
// own field, and are left without one so that the sort can be served from an index.
const COMPUTED_SORT_FIELDS: Record<string, PipelineStage.AddFields['$addFields']> = {
  email: toChannelAddressKey('email'),
  sms: toChannelAddressKey('sms'),
  // A subscriber counts as verified only when every address it can be reached at is verified, which
  // is the status the registry shows in the column.
  verified: {
    _sortKey: {
      $cond: [
        { $gt: [{ $size: { $ifNull: ['$channels', []] } }, 0] },
        { $allElementsTrue: [{ $map: { input: '$channels', as: 'c', in: { $eq: ['$$c.verified', true] } } }] },
        false,
      ],
    },
  },
};

const STORED_SORT_FIELDS: Record<string, string> = {
  name: 'addressAs',
  created: 'createdAt',
  updated: 'updatedAt',
};

const DEFAULT_SORT_FIELD = 'name';

// Results are sorted on a single column only, and not also on the id as a tie breaker. Cosmos DB's
// Mongo API only serves an ORDER BY from a composite index whose fields exactly match the sort, so
// a two-key sort here would depend on a composite index being built (and can otherwise 500 while
// Cosmos is still transforming it, or indefinitely if it never resolves). A single-key sort instead
// is served from an ordinary single-field index, which Cosmos maintains eagerly. The trade-off is
// that paging is not perfectly stable when many subscribers share the exact same sort value.
function toSubscriberSort(sort?: SubscriberSort): {
  addFields?: PipelineStage.AddFields['$addFields'];
  sortQuery: Record<string, 1 | -1>;
} {
  const field = sort?.field || DEFAULT_SORT_FIELD;
  const direction = sort?.direction === 'desc' ? -1 : 1;

  const addFields = COMPUTED_SORT_FIELDS[field];
  if (addFields) {
    return { addFields, sortQuery: { _sortKey: direction } };
  }

  const stored = STORED_SORT_FIELDS[field] || STORED_SORT_FIELDS[DEFAULT_SORT_FIELD];
  return { sortQuery: { [stored]: direction } };
}

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

  async findSubscribers(
    top: number,
    after: string,
    criteria: SubscriberCriteria,
    sort?: SubscriberSort
  ): Promise<Results<SubscriberEntity>> {
    const skip = decodeAfter(after);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (criteria.tenantIdEquals) {
      query.tenantId = criteria.tenantIdEquals.toString();
    }

    if (criteria.name) {
      query.addressAs = toContains(criteria.name);
    }

    if (criteria.sms) {
      if (criteria.email) {
        query.channels = {
          $all: [
            { $elemMatch: { channel: 'sms', address: toContains(criteria.sms) } },
            { $elemMatch: { channel: 'email', address: toContains(criteria.email.toLocaleLowerCase()) } },
          ],
        };
      } else {
        query.channels = { $elemMatch: { channel: 'sms', address: toContains(criteria.sms) } };
      }
    } else if (criteria.email) {
      query.channels = { $elemMatch: { channel: 'email', address: toContains(criteria.email.toLocaleLowerCase()) } };
    }

    // A single search value matches any of the fields the registry shows an address in, since the
    // user searching is not expected to know which of them holds what they remember.
    if (criteria.search) {
      const contains = toContains(criteria.search);
      query.$and = [
        {
          $or: [{ addressAs: contains }, { channels: { $elemMatch: { address: contains } } }],
        },
      ];
    }

    const { addFields, sortQuery } = toSubscriberSort(sort);

    const toPipeline = (sortStage?: Record<string, 1 | -1>): PipelineStage[] => {
      const stages: PipelineStage[] = [{ $match: query }];
      if (addFields) {
        stages.push({ $addFields: addFields });
      }
      if (sortStage) {
        stages.push({ $sort: sortStage });
      }
      stages.push({ $skip: skip });
      if (top > 0) {
        stages.push({ $limit: top });
      }
      return stages;
    };

    const findDocs = async (): Promise<SubscriberDoc[]> => {
      try {
        return await this.subscriberModel.aggregate<SubscriberDoc>(toPipeline(sortQuery)).exec();
      } catch (err) {
        // Cosmos DB's Mongo API rejects an ORDER BY it has no matching composite index for yet
        // (e.g. one still being built) rather than falling back to an in-memory sort itself. Rather
        // than fail the request, serve the page unsorted so the registry stays usable in the
        // meantime; the sort resumes on its own once the index is available.
        if (isUnservedSortError(err)) {
          this.logger.warn(`Sort could not be served by an available index, returning results unsorted: ${err}`);
          return await this.subscriberModel.aggregate<SubscriberDoc>(toPipeline()).exec();
        }
        throw err;
      }
    };

    const [docs, total] = await Promise.all([findDocs(), this.subscriberModel.countDocuments(query).exec()]);

    return {
      results: docs.map((doc) => this.fromDoc(doc)),
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
        total,
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
          // Subscribers recorded before the dates were kept have no stored create date; the id is
          // generated from the time of the insert, so fall back to reading it from there.
          created: doc.createdAt || toIdTimestamp(doc._id),
          updated: doc.updatedAt,
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
