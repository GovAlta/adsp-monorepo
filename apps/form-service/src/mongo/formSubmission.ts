import { AdspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, OptionalResults } from '@core-services/core-common';
import { Model, model } from 'mongoose';
import { Logger } from 'winston';
import { FormRepository, FormSubmissionCriteria, FormSubmissionEntity, FormSubmissionRepository } from '../form';
import { formSubmissionSchema } from './schema';
import { FormSubmissionDoc } from './types';

export class MongoFormSubmissionRepository implements FormSubmissionRepository {
  private submissionModel: Model<Document & FormSubmissionDoc>;

  constructor(private logger: Logger, private formRepository: FormRepository) {
    this.submissionModel = model<Document & FormSubmissionDoc>('formSubmission', formSubmissionSchema);
    this.submissionModel.on('index', (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    });
  }

  find(criteria: FormSubmissionCriteria): Promise<OptionalResults<FormSubmissionEntity>> {
    if (!criteria?.tenantIdEquals) {
      throw new InvalidOperationError('Cannot retrieve submissions without tenant context.');
    }

    // tenantId is a required criteria.
    const query: Record<string, unknown> = {
      tenantId: criteria.tenantIdEquals.toString(),
    };

    if (criteria?.formIdEquals) {
      query.formId = criteria?.formIdEquals;
    }

    if (criteria?.definitionIdEquals) {
      query.formDefinitionId = criteria?.definitionIdEquals;
    }

    if (criteria?.submissionStatusEquals) {
      query.submissionStatus = criteria.submissionStatusEquals;
    }

    if (criteria?.createDateBefore) {
      query.created = { $lt: new Date(criteria.createDateBefore).toISOString() };
    }

    if (criteria?.createDateAfter) {
      query.created = { $gt: new Date(criteria.createDateAfter).toISOString() };
    }

    if (criteria?.createdByIdEquals) {
      query['createdBy.name'] = criteria.createdByIdEquals;
    }

    if (criteria?.dispositionDateBefore) {
      query['disposition.date'] = { $lt: new Date(criteria.dispositionDateBefore).toISOString() };
    }

    if (criteria?.dispositionDateAfter) {
      query['disposition.date'] = { $gt: new Date(criteria?.dispositionDateAfter).toISOString() };
    }

    if (criteria?.dispositionStatusEquals) {
      query['disposition.status'] = criteria.dispositionStatusEquals;
    }

    return new Promise<FormSubmissionEntity[]>((resolve, reject) => {
      this.submissionModel
        .find(query, null, { lean: true })
        .sort({ created: -1 })
        .exec((err, docs) =>
          err ? reject(err) : resolve(Promise.all(docs.map((doc) => this.fromDoc(criteria.tenantIdEquals, doc))))
        );
    }).then((docs) => ({
      results: docs,
      page: {
        size: docs.length,
      },
    }));
  }

  get(tenantId: AdspId, id: string): Promise<FormSubmissionEntity> {
    return new Promise<FormSubmissionEntity>((resolve, reject) => {
      this.submissionModel
        .findOne({ tenantId: tenantId.toString(), id }, null, { lean: true })
        .exec(async (err, doc) => {
          if (err) {
            reject(err);
          } else {
            const entity = doc ? this.fromDoc(tenantId, doc) : null;
            resolve(entity);
          }
        });
    });
  }

  getByFormIdAndSubmissionId(tenantId: AdspId, id: string, formId: string): Promise<FormSubmissionEntity> {
    return new Promise<FormSubmissionEntity>((resolve, reject) => {
      this.submissionModel
        .findOne({ tenantId: tenantId.toString(), formId: formId, id: id }, null, { lean: true })
        .exec(async (err, doc) => {
          if (err) {
            reject(err);
          } else {
            const entity = doc ? this.fromDoc(tenantId, doc) : null;
            resolve(entity);
          }
        });
    });
  }

  async save(entity: FormSubmissionEntity): Promise<FormSubmissionEntity> {
    try {
      const doc = await this.submissionModel.findOneAndUpdate(
        { tenantId: entity.tenantId.toString(), id: entity.id },
        this.toDoc(entity),
        { upsert: true, new: true, lean: true }
      );

      return this.fromDoc(entity.tenantId, doc);
    } catch (err) {
      if (err?.code == 11000) {
        throw new InvalidOperationError('Cannot create duplicate form.');
      } else {
        throw err;
      }
    }
  }

  delete(entity: FormSubmissionEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.submissionModel
        .findOneAndDelete({ tenantId: entity.tenantId.toString(), id: entity.id })
        .exec((err, doc) => (err ? reject(err) : resolve(!!doc)));
    });
  }

  private toDoc(entity: FormSubmissionEntity): FormSubmissionDoc {
    return {
      tenantId: entity.tenantId.toString(),
      id: entity.id,
      formId: entity.form?.id,
      formDefinitionId: entity.formDefinitionId,
      created: entity.created,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy?.name,
      updatedById: entity.updatedBy?.id,
      submissionStatus: entity.submissionStatus,
      updatedDateTime: entity.updated,
      formData: entity.formData,
      formFiles: Object.entries(entity.formFiles).reduce(
        (fs, [key, f]) => ({ ...fs, [key]: f?.toString() }),
        {} as Record<string, string>
      ),
      disposition: entity.disposition,
      hash: entity.hash,
    };
  }

  private fromDoc = async (tenantId: AdspId, doc: FormSubmissionDoc): Promise<FormSubmissionEntity> => {
    const form = await this.formRepository.get(tenantId, doc.formId);

    return new FormSubmissionEntity(
      this,
      tenantId,
      {
        id: doc.id,
        formId: doc.formId,
        formDefinitionId: doc.formDefinitionId,
        created: doc.created,
        createdBy: doc.createdBy,
        updatedBy: { id: doc.updatedById, name: doc.updatedBy },
        submissionStatus: doc.submissionStatus,
        updated: doc.updatedDateTime,
        formData: doc.formData,
        formFiles: Object.entries(doc.formFiles).reduce(
          (fs, [key, f]) => ({ ...fs, [key]: f ? AdspId.parse(f) : null }),
          {} as Record<string, AdspId>
        ),
        disposition: doc.disposition,
        hash: doc.hash,
      },
      form
    );
  };
}
