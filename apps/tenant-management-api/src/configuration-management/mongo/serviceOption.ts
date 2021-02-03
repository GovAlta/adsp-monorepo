import { Doc } from '@core-services/core-common';
import { model, Types, Mongoose } from 'mongoose';
import { ServiceConfigurationRepository, ServiceOptionEntity, ServiceOption } from '../configuration';
import { serviceOptionSchema } from './schema';

export class MongoServiceOptionRepository implements ServiceConfigurationRepository {

  private serviceModel;

  constructor() {
    this.serviceModel = model('serviceOption', serviceOptionSchema);
  }
    
  getConfigOption(service: string): Promise<ServiceOptionEntity> {
    return new Promise<ServiceOptionEntity>((resolve, reject) => 
      this.serviceModel.findOne(
        { _id: service }, 
        null,
        { lean: true }, 
        (err, doc) => err ?
          reject(err) :
          resolve(this.fromDoc(doc))
      )
    );
  }
  
  get(name: string): Promise<ServiceOptionEntity> {
    return new Promise<ServiceOptionEntity>((resolve, reject) => 
      this.serviceModel.findOne(
        { service: name }, 
        null,
        { lean: true }, 
        (err, doc) => err ?
          reject(err) :
          resolve(this.fromDoc(doc))
      )
    );
  }

  save(entity: ServiceOptionEntity): Promise<ServiceOptionEntity> {
    return new Promise<ServiceOptionEntity>((resolve, reject) => 
      this.serviceModel.findOneAndUpdate(
        { _id: entity.id || new Types.ObjectId}, 
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
      this.serviceModel.findOneAndDelete(
        {service: entity.service},
        (err, doc) => err ? 
          reject(err) : 
          resolve(!!doc)
      )
    );
  }

  private fromDoc(doc: Doc<ServiceOption>) {
    return doc ?
      new ServiceOptionEntity(this, {
        service: doc.service,
        version: doc.version,
        id: `${doc._id}`,
        configOptions: doc.configOptions
      }) :       
      null;
  }  

  private toDoc(entity: ServiceOptionEntity) {
    return {
      service: entity.service,
      version: entity.version,
      configOptions: entity.configOptions
    }
  }
}
