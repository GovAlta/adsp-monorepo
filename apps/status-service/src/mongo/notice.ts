import { Doc, Results, decodeAfter, encodeNext } from '@core-services/core-common';
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

  async get(id: string, tenantId: string): Promise<NoticeApplicationEntity> {
    const doc = await this.model.findOne({_id: id});
    if (tenantId && doc && doc.tenantId !== tenantId) {
      return Promise.resolve(null)
    }
    return Promise.resolve(this.fromDoc(doc));
  }

  async find(
    top: number,
    after: number,
    filter: Partial<NoticeApplication>
  ): Promise<Results<NoticeApplicationEntity>> {
    let criteria = {};

    if (filter.mode != null) {
      criteria = { mode: filter.mode };
    }

    if (filter.tenantId) {
      criteria = { ...criteria, tenantId: filter.tenantId}
    }

    const total = await this.model.find(criteria, null, {lean: true}).count();
    const next = (after + top) < total ? `after=${after + top}&top=${top}` : null
    return new Promise<Results<NoticeApplicationEntity>>((resolve, reject) => {
      this.model
        .find(criteria, null, { lean: true })
        .sort({ createdAt: 1, mode: 1 })
        .skip(after)
        .limit(top)
        .exec((err, docs) =>
          err
            ? reject(err)
            : resolve({
                results: docs.map((doc) => this.fromDoc(doc)),
                page: {
                  after,
                  next,
                  size: docs.length,
                  total
                },
              })
        );
    });
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
      created: application.created,
      tenantId: application.tenantId
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
      created: doc.created,
      tenantId: doc.tenantId
    });
  }
}

export { MongoNoticeRepository };
