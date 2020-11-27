import { model } from 'mongoose';
import { decodeAfter, Doc, encodeNext, Results } from '@core-services/core-common';
import { 
  NotificationTypeEntity, 
  NotificationTypeRepository, 
  NotificationTypeCriteria, 
  NotificationType,
  NotificationSpaceEntity,
  SubscriptionRepository
} from '../notification';
import { typeSchema } from './schema';

export class MongoTypeRepository implements NotificationTypeRepository {
  
  private model;
  
  constructor(private subscriptionRepository: SubscriptionRepository) {
    this.model = model('notificationtype', typeSchema);
  }

  get(space: NotificationSpaceEntity, id: string): Promise<NotificationTypeEntity> {
    return new Promise<NotificationTypeEntity>((resolve, reject) => 
      this.model.findOne(
        { spaceId: space.id, _id: id }, 
        null,
        { lean: true }, 
        (err, doc) => err ?
          reject(err) :
          resolve(this.fromDoc(doc, space))
      )
    );
  }
  
  find(top: number, after: string, criteria: NotificationTypeCriteria): Promise<Results<NotificationTypeEntity>> {
    const skip = decodeAfter(after);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {}
    if (criteria.spaceIdEquals) {
      query.spaceId = criteria.spaceIdEquals;
    }

    if (criteria.eventCriteria) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elementQuery: any = {}
      if (criteria.eventCriteria.namespace) {
        elementQuery.namespace = criteria.eventCriteria.namespace;
      }

      if (criteria.eventCriteria.name) {
        elementQuery.name = criteria.eventCriteria.name;
      }

      if (elementQuery.namespace || elementQuery.name) {
        query.events = {
          $elemMatch: elementQuery
        }
      }
    }

    return new Promise<Results<NotificationTypeEntity>>((resolve, reject) => {
      this.model.find(query, null, { lean: true })
      .skip(skip)
      .limit(top)
      .exec((err, docs) => err ? 
        reject(err) : 
        resolve({
          results: docs.map(doc => this.fromDoc(doc)),
          page: {
            after,
            next: encodeNext(docs.length, top, skip),
            size: docs.length
          }
        })
      );
    });
  }
  
  save(type: NotificationTypeEntity): Promise<NotificationTypeEntity> {
    return new Promise<NotificationTypeEntity>((resolve, reject) => 
      this.model.findOneAndUpdate(
        { _id: type.id }, 
        this.toDoc(type), 
        { upsert: true, new: true, lean: true },
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.fromDoc(doc, type.space));
          }
        }
      )
    );
  }
  
  delete(type: NotificationTypeEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => 
      this.model.findOneAndDelete(
        { spaceId: type.spaceId, _id: type.id },
        (err, doc) => err ? 
          reject(err) : 
          resolve(!!doc)
      )
    )
    .then((deleted) => deleted ?
      this.subscriptionRepository.deleteSubscriptions(type.spaceId, type.id)
      .then(() => 
        deleted
      ) :
      Promise.resolve(deleted)
    );
  }

  private fromDoc(doc: Doc<NotificationType>, space: NotificationSpaceEntity = null): NotificationTypeEntity {
    return doc ? 
      new NotificationTypeEntity(this, {
        spaceId: doc.spaceId,
        id: doc._id,
        name: doc.name,
        description: doc.description,
        publicSubscribe: doc.publicSubscribe,
        subscriberRoles: doc.subscriberRoles,
        events: doc.events
      }, space) : 
      null
  }

  private toDoc(entity: NotificationTypeEntity): Doc<NotificationType> {
    return {
      spaceId: entity.spaceId,
      name: entity.name,
      description: entity.description,
      publicSubscribe: entity.publicSubscribe,
      subscriberRoles: entity.subscriberRoles,
      events: entity.events
    }
  }
}
