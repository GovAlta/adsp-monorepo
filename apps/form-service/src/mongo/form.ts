import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, Results } from '@core-services/core-common';
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

  save(entity: FormEntity): Promise<FormEntity> {
    return new Promise<FormEntity>((resolve, reject) =>
      this.model.findOneAndUpdate(
        { tenantId: entity.tenantId.toString(), id: entity.id },
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
      definitionId: entity.definition.id,
      applicantId: entity.applicant.urn.toString(),
      status: entity.status,
      created: entity.created,
      createdBy: entity.createdBy,
      locked: entity.locked,
      submitted: entity.submitted,
      lastAccessed: entity.lastAccessed,
      hash: entity.hash,
      data: entity.data,
      files: entity.files,
    };
  }

  private fromDoc = async (doc: FormDoc): Promise<FormEntity> => {
    const tenantId = AdspId.parse(doc.tenantId);
    const definition = await this.definitionRepository.getDefinition(tenantId, doc.definitionId);
    const applicant = doc.applicantId
      ? await this.notificationService.getSubscriber(tenantId, AdspId.parse(doc.applicantId))
      : null;
    return new FormEntity(
      this,
      definition,
      applicant,
      {
        id: doc.id,
        status: doc.status,
        created: doc.created,
        createdBy: doc.createdBy,
        locked: doc.locked,
        submitted: doc.submitted,
        lastAccessed: doc.lastAccessed,
        data: doc.data,
        files: doc.files,
      },
      doc.hash
    );
  };
}
