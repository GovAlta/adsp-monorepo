import { Doc, Results, decodeAfter, encodeNext } from '@core-services/core-common';
import { model, Types } from 'mongoose';
import { ServiceConfigurationRepository, ServiceOptionEntity, ServiceOption } from '../configuration';
import { serviceOptionSchema } from './schema';

export class MongoServiceOptionRepository implements ServiceConfigurationRepository {
  private serviceModel;

  constructor() {
    this.serviceModel = model('serviceOption', serviceOptionSchema);
  }

  find(top: number, after: string): Promise<Results<ServiceOptionEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<ServiceOptionEntity>>((resolve, reject) => {
      this.serviceModel
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

  findServiceOptions(service: string, top: number, after: string): Promise<Results<ServiceOptionEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<ServiceOptionEntity>>((resolve, reject) => {
      this.serviceModel
        .find({ service: service }, null, { lean: true })
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

  getConfigOptionByVersion(service: string, version: string): Promise<ServiceOptionEntity> {
    return new Promise<ServiceOptionEntity>((resolve, reject) =>
      this.serviceModel.findOne({ service: service, version: version }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  get(id: string): Promise<ServiceOptionEntity> {
    return new Promise<ServiceOptionEntity>((resolve, reject) =>
      this.serviceModel.findOne({ _id: id }, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  save(entity: ServiceOptionEntity): Promise<ServiceOptionEntity> {
    return new Promise<ServiceOptionEntity>((resolve, reject) =>
      this.serviceModel.findOneAndUpdate(
        { _id: entity.id || new Types.ObjectId() },
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

  delete(entity: ServiceOptionEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.serviceModel.findOneAndDelete({ service: entity.service }, (err, doc) =>
        err ? reject(err) : resolve(!!doc)
      )
    );
  }

  private fromDoc(doc: Doc<ServiceOption>) {
    return doc
      ? new ServiceOptionEntity(this, {
          service: doc.service,
          version: doc.version,
          id: `${doc._id}`,
          configOptions: doc.configOptions,
        })
      : null;
  }

  private toDoc(entity: ServiceOptionEntity) {
    return {
      service: entity.service,
      version: entity.version,
      configOptions: entity.configOptions,
    };
  }
}
