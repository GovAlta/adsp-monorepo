import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, InvalidOperationError, Results } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import { Model, model } from 'mongoose';
import { Logger } from 'winston';
import {
  FormRegistrationCriteria,
  FormRegistrationEntity,
  FormRegistrationRepository,
  normalizeEmail,
  RegistrationStatus,
} from '../form';
import { formRegistrationSchema } from './schema';
import { FormRegistrationDoc } from './types';

export class MongoFormRegistrationRepository implements FormRegistrationRepository {
  private registrationModel: Model<Document & FormRegistrationDoc>;

  constructor(private logger: Logger) {
    this.registrationModel = model<Document & FormRegistrationDoc>('formRegistration', formRegistrationSchema);
    this.registrationModel.on('index', (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    });
  }

  async get(tenantId: AdspId, definitionId: string, id: string): Promise<FormRegistrationEntity> {
    const doc = await this.registrationModel
      .findOne({ tenantId: tenantId.toString(), formDefinitionId: definitionId, id }, null, { lean: true })
      .exec();
    return doc ? this.fromDoc(tenantId, doc) : null;
  }

  async getLatestByEmail(tenantId: AdspId, definitionId: string, email: string): Promise<FormRegistrationEntity> {
    const doc = await this.registrationModel
      .findOne({ tenantId: tenantId.toString(), formDefinitionId: definitionId, email: normalizeEmail(email) }, null, {
        lean: true,
      })
      .sort({ submittedAt: -1 })
      .exec();
    return doc ? this.fromDoc(tenantId, doc) : null;
  }

  async find(top: number, after: string, criteria: FormRegistrationCriteria): Promise<Results<FormRegistrationEntity>> {
    if (!criteria?.tenantIdEquals) {
      throw new InvalidOperationError('Cannot retrieve registrations without tenant context.');
    }

    const skip = decodeAfter(after);
    const query: Record<string, unknown> = {
      tenantId: criteria.tenantIdEquals.toString(),
      formDefinitionId: criteria.definitionIdEquals,
    };
    if (criteria.statusEquals) {
      query.status = criteria.statusEquals;
    }

    const [docs, total] = await Promise.all([
      this.registrationModel.find(query, null, { lean: true }).sort({ submittedAt: -1 }).skip(skip).limit(top).exec(),
      this.registrationModel.countDocuments(query).exec(),
    ]);

    return {
      results: docs.map((doc) => this.fromDoc(criteria.tenantIdEquals, doc)),
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
        total,
      },
    };
  }

  async create(entity: FormRegistrationEntity): Promise<FormRegistrationEntity> {
    const pendingExists = await this.registrationModel
      .exists({
        tenantId: entity.tenantId.toString(),
        formDefinitionId: entity.formDefinitionId,
        email: entity.email,
        status: RegistrationStatus.Pending,
      })
      .exec();
    if (pendingExists) {
      throw new InvalidOperationError('A pending registration already exists for this email address and form.', {
        statusCode: HttpStatusCodes.CONFLICT,
      });
    }

    const doc = await this.registrationModel.findOneAndUpdate(
      { tenantId: entity.tenantId.toString(), id: entity.id },
      this.toDoc(entity),
      { upsert: true, new: true, lean: true },
    );
    return this.fromDoc(entity.tenantId, doc);
  }

  async updateIfPending(entity: FormRegistrationEntity): Promise<FormRegistrationEntity> {
    const doc = await this.registrationModel
      .findOneAndUpdate(
        {
          tenantId: entity.tenantId.toString(),
          formDefinitionId: entity.formDefinitionId,
          id: entity.id,
          status: RegistrationStatus.Pending,
        },
        { $set: { status: entity.status, reviewedAt: entity.reviewedAt, reviewedBy: entity.reviewedBy } },
        { new: true, lean: true },
      )
      .exec();
    return doc ? this.fromDoc(entity.tenantId, doc) : null;
  }

  private toDoc(entity: FormRegistrationEntity): FormRegistrationDoc {
    return {
      id: entity.id,
      tenantId: entity.tenantId.toString(),
      formDefinitionId: entity.formDefinitionId,
      status: entity.status,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      data: entity.data,
      submittedAt: entity.submittedAt,
      reviewedAt: entity.reviewedAt,
      reviewedBy: entity.reviewedBy,
    };
  }

  private fromDoc(tenantId: AdspId, doc: FormRegistrationDoc): FormRegistrationEntity {
    return new FormRegistrationEntity({
      id: doc.id,
      tenantId,
      formDefinitionId: doc.formDefinitionId,
      status: doc.status as RegistrationStatus,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      data: doc.data || {},
      submittedAt: doc.submittedAt,
      reviewedAt: doc.reviewedAt,
      reviewedBy: doc.reviewedBy ? { id: doc.reviewedBy.id, name: doc.reviewedBy.name } : undefined,
    });
  }
}
