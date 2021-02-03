import { model } from 'mongoose';
import { 
  Results,
  decodeAfter, 
  encodeNext, 
  Doc
} from '@core-services/core-common';
import { PushSpace, PushSpaceEntity, PushSpaceRepository } from '../push';
import { spaceSchema } from './schema';

export class MongoPushSpaceRepository implements PushSpaceRepository {
  
  private model;
  
  constructor() {
    this.model = model('space', spaceSchema);
  }

  find(top: number, after: string): Promise<Results<PushSpaceEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<PushSpaceEntity>>((resolve, reject) => {
      this.model.find({}, null, { lean: true })
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
  
  get(id: string): Promise<PushSpaceEntity> {
    return new Promise<PushSpaceEntity>((resolve, reject) => 
      this.model.findOne(
        { _id: id }, 
        null,
        { lean: true }, 
        (err, doc) => err ?
          reject(err) :
          resolve(this.fromDoc(doc))
      )
    );
  }

  save(entity: PushSpaceEntity): Promise<PushSpaceEntity> {
    return new Promise<PushSpaceEntity>((resolve, reject) => 
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
  
  delete(entity: PushSpaceEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => 
      this.model.findOneAndDelete(
        {_id: entity.id},
        (err, doc) => err ? 
          reject(err) : 
          resolve(!!doc)
      )
    );
  }

  private fromDoc(doc: Doc<PushSpace>) {
    return doc ? 
      new PushSpaceEntity(this, {
        id: doc._id,
        name: doc.name,
        adminRole: doc.adminRole
      }) : 
      null;
  }

  private toDoc(entity: PushSpaceEntity) {
    return {
      name: entity.name,
      adminRole: entity.adminRole
    }
  }
}
