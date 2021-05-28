import { Doc, decodeAfter, encodeNext, Results } from '@core-services/core-common';

import { model, Types } from 'mongoose';

import { DirectoryRepository, Directory, DirectoryEntity } from '../';

import { directorySchema } from './schema';

export class MongoDirectoryRepository implements DirectoryRepository {
  private directoryModel;

  constructor() {
    this.directoryModel = model('directories', directorySchema);
  }

  find(top: number, after: string): Promise<Results<DirectoryEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<DirectoryEntity>>((resolve, reject) => {
      this.directoryModel
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

  get(id: string): Promise<DirectoryEntity> {
    return new Promise<DirectoryEntity>((resolve, reject) =>
      this.directoryModel.findOne({ name: id }, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  save(entity: DirectoryEntity): Promise<DirectoryEntity> {
    return new Promise<DirectoryEntity>((resolve, reject) =>
      this.directoryModel.findOneAndUpdate(
        { _id: entity._id || new Types.ObjectId() },
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

  delete(entity: DirectoryEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.directoryModel.findOneAndDelete({ _id: entity._id }, (err, doc) => (err ? reject(err) : resolve(!!doc)))
    );
  }

  private fromDoc(doc: Doc<Directory>) {
    return doc
      ? new DirectoryEntity(this, {
          _id: `${doc._id}`,
          name: doc.name,
          services: doc.services,
        })
      : null;
  }

  private toDoc(entity: DirectoryEntity) {
    return {
      name: entity.name,
      services: entity.services,
    };
  }
}
