import { Model, model } from 'mongoose';
import * as NodeCache from 'node-cache';
import { Results, decodeAfter, encodeNext, Doc } from '@core-services/core-common';
import { FileSpaceRepository, FileSpaceEntity, FileSpace } from '../file';
import { fileSpaceSchema } from './schema';
import { FileSpaceDoc } from './types';
import { Logger } from 'winston';
import type { Tenant } from '@abgov/adsp-service-sdk';

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export class MongoFileSpaceRepository implements FileSpaceRepository {
  private model: Model<FileSpaceDoc>;

  constructor(private logger: Logger, private cache: NodeCache) {
    this.model = model('filespace', fileSpaceSchema);
  }

  find(top: number, after: string): Promise<Results<FileSpaceEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<FileSpaceEntity>>((resolve, reject) => {
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

  async getIdByTenant(tenant: Tenant): Promise<string> {
    console.log(JSON.stringify(tenant) + '<tenant');
    const res = await this.model.findOne({ name: tenant.name });
    console.log(JSON.stringify(res, getCircularReplacer()) + '<res');
    return Promise.resolve(res ? res.id : null);
  }

  get(id: string): Promise<FileSpaceEntity> {
    const entity: FileSpaceEntity = this.cache.get(this.getCacheKey(id));
    if (entity) {
      this.logger.debug(`Cache hit for Space with ID: ${id}`);
    } else {
      this.logger.debug(`Cache miss for Space with ID: ${id}`);
    }

    return entity
      ? Promise.resolve(entity)
      : new Promise<FileSpaceEntity>((resolve, reject) =>
          this.model.findOne({ _id: id }, null, { lean: true }, (err, doc) =>
            err ? reject(err) : resolve(this.fromDoc(doc))
          )
        ).then((loaded) => {
          this.cache.set(this.getCacheKey(id), loaded);
          return loaded;
        });
  }

  getType(spaceId: string, typeId: string) {
    return this.get(spaceId).then((spaceEntity) => (spaceEntity ? spaceEntity.types[typeId] : null));
  }

  save(entity: FileSpaceEntity): Promise<FileSpaceEntity> {
    return new Promise<FileSpaceEntity>((resolve, reject) =>
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
    ).then((saved) => {
      this.cache.del(this.getCacheKey(saved.id));
      return saved;
    });
  }

  delete(entity: FileSpaceEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.model.findOneAndDelete({ _id: entity.id }, null, (err, doc) => (err ? reject(err) : resolve(!!doc)))
    ).then((deleted) => {
      this.cache.del(entity.id);
      return deleted;
    });
  }

  private getCacheKey(id: string) {
    return `space-${id}`;
  }

  private fromDoc(doc: Doc<FileSpace>) {
    return doc
      ? new FileSpaceEntity(this, {
          id: doc._id,
          name: doc.name,
          spaceAdminRole: doc.spaceAdminRole,
          types: Object.entries(doc.types || {}).reduce((types, [id, type]) => {
            types[id] = {
              id: type._id,
              name: type.name,
              anonymousRead: type.anonymousRead,
              readRoles: type.readRoles,
              updateRoles: type.updateRoles,
              spaceId: type.spaceId,
            };
            return types;
          }, {}),
        })
      : null;
  }

  private toDoc(entity: FileSpaceEntity) {
    return {
      name: entity.name,
      spaceAdminRole: entity.spaceAdminRole,
      types: Object.entries(entity.types || {}).reduce((types, [id, type]) => {
        types[id] = {
          _id: type.id,
          id: type.id,
          name: type.name,
          anonymousRead: type.anonymousRead,
          readRoles: type.readRoles,
          updateRoles: type.updateRoles,
          spaceId: entity.id,
        };

        return types;
      }, {}),
    };
  }
}
