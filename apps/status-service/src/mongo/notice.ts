import { Doc } from '@core-services/core-common';
import { Model, model, Document } from 'mongoose';
import { NoticeApplication } from '../app/types/index';
import { NoticeApplicationEntity } from '../app/model/notice';
import { NoticeRepository } from '../app/repository/notice';
import { noticeApplicationSchema } from './schema';

export default class MongoNoticeRepository implements NoticeRepository {
  model: Model<NoticeApplication & Document>;
  constructor() {
    this.model = model('Notice', noticeApplicationSchema);
  }

  async get(id: string): Promise<NoticeApplicationEntity> {
    const doc = await this.model.findById(id);
    return Promise.resolve(this.fromDoc(doc));
  }

  async find(filter: Partial<NoticeApplication>): Promise<NoticeApplicationEntity[]> {
    const docs = await this.model.find(filter);
    return docs.map((doc) => this.fromDoc(doc));
  }

  async save(entity: NoticeApplicationEntity): Promise<NoticeApplicationEntity> {
    if (entity.id) {
      const doc = await this.model.findOneAndUpdate({ _id: entity.id }, this.toDoc(entity), {
        upsert: true,
        new: true,
        lean: true,
        useFindAndModify: false,
      });

      return this.fromDoc(doc);
    }

    const doc = await this.model.create(this.toDoc(entity));
    return this.fromDoc(doc);
  }

  async delete(entity: NoticeApplicationEntity): Promise<boolean> {
    try {
      await this.model.findOneAndDelete({ _id: entity.id });
      return true;
    } catch (e) {
      return false;
    }
  }

  private toDoc(application: NoticeApplicationEntity): Doc<NoticeApplication> {
    return {
      _id: application.id,
      message: application.message,
      tennantServRef: application.tennantServRef,
      startDate: application.startDate,
      endDate: application.endDate,
      mode: application.mode,
    };
  }

  private fromDoc(doc: Doc<NoticeApplication>): NoticeApplicationEntity {
    if (!doc) {
      return null;
    }
    return new NoticeApplicationEntity(this, {
      id: doc._id,
      message: doc.message,
      tennantServRef: doc.tennantServRef,
      startDate: doc.startDate,
      endDate: doc.endDate,
      mode: doc.mode,
    });
  }
}

export { MongoNoticeRepository };
