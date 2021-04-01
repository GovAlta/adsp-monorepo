import { Doc } from '@core-services/core-common';
import { model } from 'mongoose';
import * as NodeCache from 'node-cache';
import { PushSpaceEntity, PushSpaceRepository, Stream, StreamEntity, StreamRepository } from '../push';
import { streamSchema } from './schema';

export class MongoStreamRepository implements StreamRepository {
  private model;

  constructor(private spaceRepository: PushSpaceRepository, private cache: NodeCache) {
    this.model = model('stream', streamSchema);
  }

  get({ spaceId, id }): Promise<StreamEntity> {
    const entity = this.cache.get<StreamEntity>(this.getCacheKey({ spaceId, id }));

    return entity
      ? Promise.resolve(entity)
      : new Promise<StreamEntity>((resolve, reject) =>
          this.model
            .findOne({ spaceId, _id: id }, null, { lean: true })
            .populate('spaceId')
            .exec((err, doc) =>
              err
                ? reject(err)
                : resolve(
                    this.fromDoc(
                      doc ? { ...doc, spaceId } : null,
                      doc ? new PushSpaceEntity(this.spaceRepository, doc.spaceId) : null
                    )
                  )
            )
        ).then((entity) => {
          if (entity) {
            this.cache.set(this.getCacheKey(entity), entity);
          }

          return entity;
        });
  }

  save(entity: StreamEntity): Promise<StreamEntity> {
    return new Promise<StreamEntity>((resolve, reject) =>
      this.model.findOneAndUpdate(
        { _id: entity.id },
        this.toDoc(entity),
        { upsert: true, new: true, lean: true },
        (err, doc) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.fromDoc(doc, entity.space));
          }
        }
      )
    ).then((entity) => {
      this.cache.del(this.getCacheKey(entity));
      return entity;
    });
  }

  delete(entity: StreamEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.model.findOneAndDelete({ _id: entity.id }, (err, doc) => (err ? reject(err) : resolve(!!doc)))
    ).then((result) => {
      this.cache.del(this.getCacheKey(entity));
      return result;
    });
  }

  private fromDoc(doc: Doc<Stream>, space: PushSpaceEntity) {
    return doc
      ? new StreamEntity(this, new PushSpaceEntity(null, space), {
          spaceId: doc.spaceId,
          id: doc._id,
          name: doc.name,
          subscriberRoles: doc.subscriberRoles,
          events: doc.events,
        })
      : null;
  }

  private toDoc(entity: StreamEntity) {
    return {
      spaceId: entity.spaceId,
      name: entity.name,
      subscriberRoles: entity.subscriberRoles,
      events: entity.events,
    };
  }

  private getCacheKey({ spaceId, id }: { spaceId: string; id: string }) {
    return `${spaceId}/${id}`;
  }
}
