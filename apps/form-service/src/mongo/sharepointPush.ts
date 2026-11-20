import { AdspId } from '@abgov/adsp-service-sdk';
import { Model, model } from 'mongoose';
import { Logger } from 'winston';
import { SharePointPush, SharePointPushRepository } from '../form';
import { sharePointPushSchema } from './schema';
import { SharePointPushDoc } from './types';

export class MongoSharePointPushRepository implements SharePointPushRepository {
  private pushModel: Model<Document & SharePointPushDoc>;

  constructor(private logger: Logger) {
    this.pushModel = model<Document & SharePointPushDoc>('sharePointPush', sharePointPushSchema);
    this.pushModel.on('index', (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    });
  }

  async create(push: SharePointPush): Promise<void> {
    await this.pushModel.updateOne({ id: push.id }, { $set: this.toDoc(push) }, { upsert: true }).exec();
  }

  async claimDue(now: Date, leaseMs: number): Promise<SharePointPush | null> {
    // A single atomic update, so pods running the job together never take the same push.
    const doc = await this.pushModel
      .findOneAndUpdate(
        { nextAttemptAt: { $lte: now } },
        { $set: { nextAttemptAt: new Date(now.getTime() + leaseMs) }, $inc: { attempts: 1 } },
        { new: true, lean: true, sort: { nextAttemptAt: 1 } },
      )
      .exec();
    return doc ? this.fromDoc(doc) : null;
  }

  async reschedule(id: string, nextAttemptAt: Date, lastErrorCode: string): Promise<void> {
    await this.pushModel.updateOne({ id }, { $set: { nextAttemptAt, lastErrorCode } }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.pushModel.deleteOne({ id }).exec();
  }

  private toDoc(push: SharePointPush): SharePointPushDoc {
    return {
      id: push.id,
      tenantId: push.tenantId.toString(),
      formId: push.formId,
      submissionId: push.submissionId,
      attempts: push.attempts,
      nextAttemptAt: push.nextAttemptAt,
      lastErrorCode: push.lastErrorCode,
    };
  }

  private fromDoc(doc: SharePointPushDoc): SharePointPush {
    return {
      id: doc.id,
      tenantId: AdspId.parse(doc.tenantId),
      formId: doc.formId,
      submissionId: doc.submissionId,
      attempts: doc.attempts,
      nextAttemptAt: doc.nextAttemptAt,
      lastErrorCode: doc.lastErrorCode,
    };
  }
}
