import { model } from 'mongoose';
import { Results, decodeAfter, encodeNext, Doc } from '@core-services/core-common';
import { NotificationSpace, NotificationSpaceEntity, NotificationSpaceRepository } from '../notification';
import { spaceSchema } from './schema';

export class MongoNotificationSpaceRepository implements NotificationSpaceRepository {
  private model;

  constructor() {
    this.model = model('space', spaceSchema);
  }

  find(top: number, after: string): Promise<Results<NotificationSpaceEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<NotificationSpaceEntity>>((resolve, reject) => {
      this.model
        .find({}, null, { lean: true })
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

  get(id: string): Promise<NotificationSpaceEntity> {
    return new Promise<NotificationSpaceEntity>((resolve, reject) =>
      this.model.findOne({ _id: id }, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  save(entity: NotificationSpaceEntity): Promise<NotificationSpaceEntity> {
    return new Promise<NotificationSpaceEntity>((resolve, reject) =>
      this.model.findOneAndUpdate(
        { _id: entity.id },
        this.toDoc(entity),
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

  delete(entity: NotificationSpaceEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.model.findOneAndDelete({ _id: entity.id }, (err, doc) => (err ? reject(err) : resolve(!!doc)))
    );
  }

  private fromDoc(doc: Doc<NotificationSpace>) {
    return doc
      ? new NotificationSpaceEntity(this, {
          id: doc._id,
          name: doc.name,
          spaceAdminRole: doc.spaceAdminRole,
          subscriberAdminRole: doc.subscriberAdminRole,
        })
      : null;
  }

  private toDoc(entity: NotificationSpaceEntity) {
    return {
      name: entity.name,
      spaceAdminRole: entity.spaceAdminRole,
      subscriberAdminRole: entity.subscriberAdminRole,
    };
  }
}
