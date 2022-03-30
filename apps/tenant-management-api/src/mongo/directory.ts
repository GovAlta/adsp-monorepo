import { Doc, decodeAfter, encodeNext, Results } from '@core-services/core-common';
import { model, Types } from 'mongoose';
import { DirectoryRepository, Directory, DirectoryEntity, Criteria } from '../directory';
import { directorySchema } from './schema';

export class MongoDirectoryRepository implements DirectoryRepository {
  private directoryModel;

  constructor() {
    this.directoryModel = model('directories', directorySchema);
  }

  find(top: number, after: string, criteria: Criteria): Promise<Results<DirectoryEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<DirectoryEntity>>((resolve, reject) => {
      this.directoryModel
        .find(criteria, null, { lean: true })
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

  async save(entity: DirectoryEntity): Promise<DirectoryEntity> {
    try {
      return new Promise<DirectoryEntity>((resolve, reject) =>
        this.directoryModel.findOneAndUpdate(
          { name: entity.name || new Types.ObjectId() },
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
    } catch (err) {
      return err.message;
    }
  }

  delete(entity: DirectoryEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.directoryModel.deleteOne({ name: entity.name }, (err, doc) => (err ? reject(err) : resolve(!!doc)))
    );
  }

  getDirectories(name: string): Promise<DirectoryEntity> {
    return new Promise<DirectoryEntity>((resolve, reject) =>
      this.directoryModel.findOne({ name: name }, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  update(directory: Directory): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.directoryModel.findOneAndUpdate({ name: directory.name }, directory, { upsert: true }, (err, doc) =>
        err ? reject(err) : resolve(!!doc)
      )
    );
  }

  async exists(name: string): Promise<boolean> {
    const result = await this.directoryModel.findOne({
      where: { name: name },
    });

    return !!result === true;
  }

  private fromDoc(doc: Doc<Directory>) {
    return doc ? new DirectoryEntity(this, { id: `${doc._id}`, name: doc.name, services: doc.services }) : null;
  }

  private toDoc(entity: DirectoryEntity) {
    return {
      name: entity.name,
      services: entity.services,
    };
  }
}
