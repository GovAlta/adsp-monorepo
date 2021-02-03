import { Doc } from '@core-services/core-common';
import { model } from 'mongoose';
import { TenantConfigurationRepository, TenantConfig, TenantConfigEntity } from '../configuration';
import { tenantConfigSchema } from './schema';

export class MongoTenantConfigurationRepository implements TenantConfigurationRepository {

  private tenantConfigModel;

  constructor() {
    this.tenantConfigModel = model('tenantConfig', tenantConfigSchema);
  }
  
  getTenantConfig(service: string): Promise<TenantConfigEntity> {
    return new Promise<TenantConfigEntity>((resolve, reject) => 
      this.tenantConfigModel.findOne(
        { _id: service }, 
        null,
        { lean: true }, 
        (err, doc) => err ?
          reject(err) :
          resolve(this.fromDoc(doc))
      )
    );
  }
  
  get(name: string): Promise<TenantConfigEntity> {
    return new Promise<TenantConfigEntity>((resolve, reject) => 
      this.tenantConfigModel.findOne(
        { realmName: name }, 
        null,
        { lean: true }, 
        (err, doc) => err ?
          reject(err) :
          resolve(this.fromDoc(doc))
      )
    );
  }

  save(entity: TenantConfigEntity): Promise<TenantConfigEntity> {
    return new Promise<TenantConfigEntity>((resolve, reject) => 
      this.tenantConfigModel.findOneAndUpdate(
        { realmName: entity.realmName }, 
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
      this.tenantConfigModel.findOneAndDelete(
        {realmName: entity.realmName},
        (err, doc) => err ? 
          reject(err) : 
          resolve(!!doc)
      )
    );
  }

  private fromDoc(doc: Doc<TenantConfig>) {
    return doc ?
      new TenantConfigEntity(this, {
        realmName: doc.realmName,
        configurationSettingsList: doc.configurationSettingsList,
      }) :       
      null;
  }  

  private toDoc(entity: TenantConfigEntity) {
    return {
      realmName: entity.realmName,
      configurationSettingsList: entity.configurationSettingsList
    }
  }
}
