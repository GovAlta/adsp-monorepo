import { Doc, decodeAfter, encodeNext, Results } from '@core-services/core-common';
import { model, Types } from 'mongoose';
import { TenantConfigurationRepository, TenantConfig, TenantConfigEntity } from '../configuration';
import { tenantConfigSchema } from './schema';

export class MongoTenantConfigurationRepository implements TenantConfigurationRepository {
  private tenantConfigModel;

  constructor() {
    this.tenantConfigModel = model('tenantConfig', tenantConfigSchema);
  }

  find(top: number, after: string): Promise<Results<TenantConfigEntity>> {
    const skip = decodeAfter(after);
    return new Promise<Results<TenantConfigEntity>>((resolve, reject) => {
      this.tenantConfigModel
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

  getTenantConfig(tenantName: string): Promise<TenantConfigEntity> {
    return new Promise<TenantConfigEntity>((resolve, reject) =>
      this.tenantConfigModel.findOne({ tenantName: tenantName }, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  get(id: string): Promise<TenantConfigEntity> {
    return new Promise<TenantConfigEntity>((resolve, reject) =>
      this.tenantConfigModel.findOne({ _id: id }, null, { lean: true }, (err, doc) =>
        err ? reject(err) : resolve(this.fromDoc(doc))
      )
    );
  }

  save(entity: TenantConfigEntity): Promise<TenantConfigEntity> {
    return new Promise<TenantConfigEntity>((resolve, reject) =>
      this.tenantConfigModel.findOneAndUpdate(
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

  delete(entity: TenantConfigEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) =>
      this.tenantConfigModel.findOneAndDelete({ _id: entity.id }, (err, doc) => (err ? reject(err) : resolve(!!doc)))
    );
  }

  private fromDoc(doc: Doc<TenantConfig>) {
    return doc
      ? new TenantConfigEntity(this, {
          id: `${doc._id}`,
          tenantName: doc.tenantName,
          configurationSettingsList: doc.configurationSettingsList,
        })
      : null;
  }

  private toDoc(entity: TenantConfigEntity) {
    return {
      tenantName: entity.tenantName,
      configurationSettingsList: entity.configurationSettingsList,
    };
  }
}
