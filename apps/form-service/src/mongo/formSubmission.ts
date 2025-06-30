import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, InvalidOperationError, Results } from '@core-services/core-common';
import { Model, model } from 'mongoose';
import { Logger } from 'winston';
import {
  FormDefinitionRepository,
  FormRepository,
  FormSubmissionCriteria,
  FormSubmissionEntity,
  FormSubmissionRepository,
} from '../form';
import { formSubmissionSchema } from './schema';
import { FormSubmissionDoc } from './types';

export class MongoFormSubmissionRepository implements FormSubmissionRepository {
  private submissionModel: Model<Document & FormSubmissionDoc>;

  constructor(
    private logger: Logger,
    private definitionRepository: FormDefinitionRepository,
    private formRepository: FormRepository
  ) {
    this.submissionModel = model<Document & FormSubmissionDoc>('formSubmission', formSubmissionSchema);
    this.submissionModel.on('index', (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    });
  }

  find(top: number, after: string, criteria: FormSubmissionCriteria): Promise<Results<FormSubmissionEntity>> {
    // tenantId is a required criteria.
    if (!criteria?.tenantIdEquals) {
      throw new InvalidOperationError('Cannot retrieve submissions without tenant context.');
    }

    const skip = decodeAfter(after);
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

    if (typeof criteria?.dispositioned === 'boolean') {
      query['disposition.id'] = { $exists: criteria.dispositioned };
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

    if (criteria?.dataCriteria) {
      Object.entries(criteria.dataCriteria).forEach(([property, value]) => {
        query[`formData.${property}`] = value;
      });
    }

    return new Promise<FormSubmissionEntity[]>((resolve, reject) => {
      this.submissionModel
        .find(query, null, { lean: true })
        .sort({ created: -1 })
        .skip(skip)
        .limit(top)
        .exec((err, docs) =>
          err ? reject(err) : resolve(Promise.all(docs.map((doc) => this.fromDoc(criteria.tenantIdEquals, doc))))
        );
    }).then((docs) => ({
      results: docs,
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    }));
  }

  get(tenantId: AdspId, id: string, formId?: string): Promise<FormSubmissionEntity> {
    return new Promise<FormSubmissionEntity>((resolve, reject) => {
      const query = { tenantId: tenantId.toString(), id };
      if (formId) {
        query['formId'] = formId;
      }

      this.submissionModel.findOne(query, null, { lean: true }).exec(async (err, doc) => {
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
      formDefinitionRevision: entity.formDefinitionRevision,
      created: entity.created,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy?.name,
      updatedById: entity.updatedBy?.id,
      submissionStatus: entity.submissionStatus,
      securityClassification: entity.securityClassification,
      updatedDateTime: entity.updated,
      formData: entity.formData,
      formFiles: Object.entries(entity.formFiles).reduce(
        (fs, [key, f]) => ({ ...fs, [key.replace('.', ':')]: f?.toString() }),
        {} as Record<string, string>
      ),
      disposition: entity.disposition,
      hash: entity.hash,
      dryRun: entity.form?.dryRun,
    };
  }

  private fromDoc = async (tenantId: AdspId, doc: FormSubmissionDoc): Promise<FormSubmissionEntity> => {
    // Get the definition and form separately since it's possible that one or the other has been deleted.
    const definition = await this.definitionRepository.getDefinition(tenantId, doc.formDefinitionId);
    const form = await this.formRepository.get(tenantId, doc.formId);

    return new FormSubmissionEntity(
      this,
      tenantId,
      {
        id: doc.id,
        formId: doc.formId,
        formDefinitionId: doc.formDefinitionId,
        formDefinitionRevision: doc.formDefinitionRevision,
        created: doc.created,
        createdBy: doc.createdBy,
        updatedBy: { id: doc.updatedById, name: doc.updatedBy },
        submissionStatus: doc.submissionStatus,
        securityClassification: doc.securityClassification,
        updated: doc.updatedDateTime,
        formData: doc.formData,
        formFiles: Object.entries(doc.formFiles).reduce(
          (fs, [key, f]) => ({ ...fs, [key.replace(':', '.')]: f ? AdspId.parse(f) : null }),
          {} as Record<string, AdspId>
        ),
        disposition: doc.disposition,
        hash: doc.hash,
        dryRun: doc.dryRun,
      },
      definition,
      form
    );
  };
}
