import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, InvalidOperationError, Results } from '@core-services/core-common';
import { Model, model } from 'mongoose';
import { FormCriteria, FormEntity, FormRepository } from '../form';
import { FormDefinitionRepository } from '../form';
import { NotificationService } from '../notification';
import { formSchema } from './schema';
import { FormDoc } from './types';

export class MongoFormRepository implements FormRepository {
  private model: Model<Document & FormDoc>;

  constructor(
    private definitionRepository: FormDefinitionRepository,
    private notificationService: NotificationService
  ) {
    this.model = model<Document & FormDoc>('form', formSchema);
  }

  find(top: number, after: string, criteria: FormCriteria): Promise<Results<FormEntity>> {
    const skip = decodeAfter(after);
    const query: Record<string, unknown> = {};

    if (criteria?.tenantIdEquals) {
      query.tenantId = criteria.tenantIdEquals.toString();
    }

    if (criteria?.definitionIdEquals) {
      query.definitionId = criteria?.definitionIdEquals;
    }

    if (criteria?.statusEquals) {
      query.status = criteria.statusEquals;
    }

    if (criteria?.lockedBefore) {
      query.locked = { $lt: criteria.lockedBefore };
    }

    if (criteria?.lastAccessedBefore) {
      query.lastAccessed = { $lt: criteria.lastAccessedBefore };
    }

    if (criteria?.hashEquals) {
      query.hash = criteria.hashEquals;
    }

    if (criteria?.createdByIdEquals) {
      query['createdBy.id'] = criteria.createdByIdEquals;
    }

    if (criteria?.anonymousApplicantEquals !== undefined) {
      query.anonymousApplicant = criteria.anonymousApplicantEquals;
    }

    return new Promise<FormEntity[]>((resolve, reject) => {
      this.model
        .find(query, null, { lean: true })
        .skip(skip)
        .limit(top)
        .sort({ created: -1 })
        .exec((err, docs) => (err ? reject(err) : resolve(Promise.all(docs.map((doc) => this.fromDoc(doc))))));
    }).then((docs) => ({
      results: docs,
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    }));
  }

  get(tenantId: AdspId, id: string): Promise<FormEntity> {
    return new Promise<FormEntity>((resolve, reject) => {
      this.model.findOne({ tenantId: tenantId.toString(), id }, null, { lean: true }).exec(async (err, doc) => {
        if (err) {
          reject(err);
        } else {
          const entity = doc ? this.fromDoc(doc) : null;
          resolve(entity);
        }
      });
    });
  }

  async save(entity: FormEntity): Promise<FormEntity> {
    try {
      const updateDoc = this.toDoc(entity);
      const { data, files, status, lastAccessed, locked, submitted, hash, ...insertDoc } = updateDoc;
      const doc = await this.model.findOneAndUpdate(
        { tenantId: entity.tenantId.toString(), id: entity.id },
        { $setOnInsert: insertDoc, $set: { data, files, status, lastAccessed, locked, submitted, hash } },
        { upsert: true, new: true, lean: true }
      );

      return this.fromDoc(doc);
    } catch (err) {
      if (err?.code == 11000) {
        throw new InvalidOperationError('Cannot create duplicate form.');
      } else {
        throw err;
      }
    }
  }

  delete(entity: FormEntity): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.model
        .findOneAndDelete({ tenantId: entity.tenantId.toString(), id: entity.id })
        .exec((err, doc) => (err ? reject(err) : resolve(!!doc)));
    });
  }

  private toDoc(entity: FormEntity): FormDoc {
    return {
      tenantId: entity.tenantId.toString(),
      id: entity.id,
      formDraftUrl: entity.formDraftUrl,
      anonymousApplicant: entity.anonymousApplicant,
      definitionId: entity.definition.id,
      // NOTE: This is only set on insert (create).
      // The UUID is necessary due to backwards compatibility with a unique index on tenant, definition, and applicant IDs.
      // Setting form ID makes the unique context effectively tenant, definition, form IDs.
      applicantId: entity.applicant?.urn.toString() || entity.id,
      status: entity.status,
      created: entity.created,
      createdBy: entity.createdBy,
      locked: entity.locked,
      dispositionStates: entity.dispositionStates,
      submissionRecords: entity.submissionRecords,
      submitted: entity.submitted,
      lastAccessed: entity.lastAccessed,
      hash: entity.hash,
      data: entity.data,
      files: Object.entries(entity.files).reduce((fs, [key, f]) => ({ ...fs, [key]: f?.toString() }), {}),
    };
  }

  private fromDoc = async (doc: FormDoc): Promise<FormEntity> => {
    const tenantId = AdspId.parse(doc.tenantId);
    const definition = await this.definitionRepository.getDefinition(tenantId, doc.definitionId);

    // NOTE: The applicant ID is a UUID in case there's no associated Subscriber;
    // this is necessary for backwards compatibility with index.
    const applicant = AdspId.isAdspId(doc.applicantId)
      ? await this.notificationService.getSubscriber(tenantId, AdspId.parse(doc.applicantId))
      : null;
    return new FormEntity(
      this,
      definition,
      applicant,
      {
        id: doc.id,
        formDraftUrl: doc.formDraftUrl,
        anonymousApplicant: doc.anonymousApplicant,
        status: doc.status,
        created: doc.created,
        createdBy: doc.createdBy,
        locked: doc.locked,
        dispositionStates: doc.dispositionStates,
        submitted: doc.submitted,
        lastAccessed: doc.lastAccessed,
        data: doc.data,
        files: Object.entries(doc.files).reduce((fs, [key, f]) => ({ ...fs, [key]: f ? AdspId.parse(f) : null }), {}),
      },
      doc.hash
    );
  };
}
