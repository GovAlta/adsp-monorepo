import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, InvalidOperationError, Results } from '@core-services/core-common';
import { Model, model } from 'mongoose';
import { Logger } from 'winston';
import { FormCriteria, FormEntity, FormRepository } from '../form';
import { FormDefinitionRepository } from '../form';
import { NotificationService, Subscriber } from '../notification';
import { formSchema } from './schema';
import { FormDoc } from './types';
import { getVersionFromDefinitionId } from './helpers';

export class MongoFormRepository implements FormRepository {
  private model: Model<Document & FormDoc>;

  constructor(
    private logger: Logger,
    private definitionRepository: FormDefinitionRepository,
    private notificationService: NotificationService,
  ) {
    this.model = model<Document & FormDoc>('form', formSchema);
    this.model.on('index', (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    });
  }

  // clean-code-ignore: 2.10 - The find method is appropriately complex due to the number of criteria that can be applied to the search.
  // clean-code-ignore: 2.17 - The find method is appropriately complex due to the number of criteria that can be applied to the search.
  find(top: number, after: string, criteria: FormCriteria): Promise<Results<FormEntity>> {
    const skip = decodeAfter(after);
    const revision = criteria?.revisionEquals;

    const formSearchCriteria: Record<string, unknown> = {
      ...(criteria?.tenantIdEquals && { tenantId: criteria.tenantIdEquals.toString() }),
      ...(revision !== undefined && revision !== null && { id: revision }),
      ...(criteria?.definitionIdEquals && {
        definitionId: { $regex: `${criteria.definitionIdEquals}`, $options: 'i' },
      }),
      ...(criteria?.statusEquals && { status: criteria.statusEquals }),
      ...(criteria?.lockedBefore && { locked: { $lt: criteria.lockedBefore } }),
      ...(criteria?.lastAccessedBefore && { lastAccessed: { $lt: criteria.lastAccessedBefore } }),
      ...(criteria?.hashEquals && { hash: criteria.hashEquals }),
      ...(criteria?.createdByIdEquals && { 'createdBy.id': criteria.createdByIdEquals }),
      ...(criteria?.anonymousApplicantEquals !== undefined && {
        anonymousApplicant: criteria.anonymousApplicantEquals,
      }),
      ...Object.fromEntries(
        Object.entries(criteria?.dataCriteria ?? {}).map(([property, value]) => [`data.${property}`, value]),
      ),
    };

    return new Promise<FormEntity[]>((resolve, reject) => {
      this.model
        .find(formSearchCriteria, null, { lean: true })
        .sort({ version: -1, created: -1 })
        .skip(skip)
        .limit(top)
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
      const query: Record<string, unknown> = {
        tenantId: entity.tenantId.toString(),
        id: entity.id,
      };

      if (entity?.definition?.revision !== undefined && entity?.definition?.revision !== null) {
        query.id = `${query.id}-v${Number(entity?.definition?.revision)}`;
      }

      const insert = {
        ...insertDoc,
        ...(query.version !== undefined ? { version: query.version } : {}),
      };

      const doc = await this.model.findOneAndUpdate(
        query,
        {
          $setOnInsert: insert,
          $set: {
            data,
            files,
            status,
            lastAccessed,
            locked,
            submitted,
            hash,
          },
        },
        {
          upsert: true,
          new: true,
          lean: true,
        },
      );

      return this.fromDoc(doc);
    } catch (err) {
      console.log(JSON.stringify(err.message) + '<err.message');
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

  // clean-code-ignore: 2.10 - The toDoc method is appropriately complex due to the number of properties that need to be mapped from the entity to the document.
  private toDoc(entity: FormEntity): FormDoc {
    const {
      id,
      formDraftUrl,
      anonymousApplicant,
      status,
      created,
      createdBy,
      locked,
      submitted,
      lastAccessed,
      securityClassification,
      hash,
      data,
      dryRun,
      registeredId,
    } = entity;

    const common = {
      id,
      formDraftUrl,
      anonymousApplicant,
      status,
      created,
      createdBy,
      locked,
      submitted,
      lastAccessed,
      securityClassification,
      hash,
      data,
      dryRun,
      registeredId,
    };

    return {
      tenantId: entity.tenantId.toString(),
      ...common,
      definitionId: entity.definition?.id,
      applicantId: entity.definition?.oneFormPerApplicant && entity.applicant ? entity.applicant.urn.toString() : id,
      subscriberId: entity.applicant?.urn.toString(),
      files: Object.fromEntries(Object.entries(entity.files).map(([key, f]) => [key.replace('.', ':'), f?.toString()])),
    };
  }

  // clean-code-ignore: 2.17 - The fromDoc method is appropriately complex due to the number of properties that need to be mapped from the document to the entity, as well as the necessary lookups to populate the definition and applicant.
  // clean-code-ignore: 2.18 - side effects are necessary in the fromDoc method to perform the necessary lookups to populate the definition and applicant.
  private fromDoc = async (doc: FormDoc): Promise<FormEntity> => {
    const tenantId = AdspId.parse(doc.tenantId);
    const definition = await this.definitionRepository.getDefinition(tenantId, doc.definitionId);

    let applicant: Subscriber;
    if (AdspId.isAdspId(doc.subscriberId)) {
      applicant = await this.notificationService.getSubscriber(tenantId, AdspId.parse(doc.subscriberId));
    } else if (AdspId.isAdspId(doc.applicantId)) {
      // NOTE: The applicant ID is a UUID in case there's no associated Subscriber;
      // this is necessary for backwards compatibility with index.
      applicant = await this.notificationService.getSubscriber(tenantId, AdspId.parse(doc.applicantId));
    }

    return new FormEntity(
      this,
      tenantId,
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
        submitted: doc.submitted,
        lastAccessed: doc.lastAccessed,
        data: doc.data,
        securityClassification: doc.securityClassification,
        files: Object.entries(doc.files).reduce(
          (fs, [key, f]) => ({ ...fs, [key.replace(':', '.')]: f ? AdspId.parse(f) : null }),
          {},
        ),
        dryRun: doc.dryRun,
        version: getVersionFromDefinitionId(doc.definitionId),
      },
      doc.hash,
    );
  };
}
