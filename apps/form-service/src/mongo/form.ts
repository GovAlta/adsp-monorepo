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

  find(top: number, after: string, criteria: FormCriteria): Promise<Results<FormEntity>> {
    const skip = decodeAfter(after);
    const query: Record<string, unknown> = {};

    if (criteria?.tenantIdEquals) {
      query.tenantId = criteria.tenantIdEquals.toString();
    }

    if (criteria?.definitionIdEquals) {
      const escapedDefinitionId = criteria.definitionIdEquals.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (criteria?.revisionEquals !== undefined && criteria?.revisionEquals !== null) {
        query.definitionId = {
          $regex: `^${escapedDefinitionId}-v${criteria.revisionEquals}$`,
          $options: 'i',
        };
      } else {
        query.definitionId = {
          $regex: `^${escapedDefinitionId}(?:-v\\d+)?$`,
          $options: 'i',
        };
      }
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

    if (criteria?.dataCriteria) {
      Object.entries(criteria.dataCriteria).forEach(([property, value]) => {
        query[`data.${property}`] = value;
      });
    }

    return new Promise<FormEntity[]>((resolve, reject) => {
      this.model
        .find(query, null, { lean: true })
        .sort({ created: -1 })
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
      const rawId = id;
      const cleanId = rawId.replace(/-v\d+$/, '');

      this.model
        .findOne({ tenantId: tenantId.toString(), id: cleanId }, null, { lean: true })
        .exec(async (err, doc) => {
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
      let version = entity.version !== undefined && entity.version !== null ? Number(entity.version) : undefined;

      if (version === undefined && entity.definition?.version !== undefined) {
        version = entity.definition.version;
      }

      const updateDoc = this.toDoc(entity);

      if (version !== undefined) {
        updateDoc.definitionId = `${updateDoc.definitionId}-v${version}`;

        updateDoc.version = version;
      }

      const { data, files, status, lastAccessed, locked, submitted, hash, ...insertDoc } = updateDoc;

      const query: Record<string, unknown> = {
        tenantId: entity.tenantId.toString(),
        id: entity.id, // versionedId,
      };

      const doc = await this.model.findOneAndUpdate(
        query,
        {
          $setOnInsert: insertDoc,
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
      if (err?.code == 11000) {
        throw new InvalidOperationError('Cannot create duplicate form.');
      } else {
        throw err;
      }
    }
  }

  async delete(entity: FormEntity): Promise<boolean> {
    const doc = await this.model.findOneAndDelete({ tenantId: entity.tenantId.toString(), id: entity.id }).lean();

    return !!doc;
  }

  private toDoc(entity: FormEntity): FormDoc {
    return {
      tenantId: entity.tenantId.toString(),
      id: entity.id,
      formDraftUrl: entity.formDraftUrl,
      anonymousApplicant: entity.anonymousApplicant,
      definitionId: entity.definition?.id,
      // NOTE: This is only set on insert (create).
      // The UUID is necessary due to backwards compatibility with a unique index on tenant, definition, and applicant IDs.
      // Setting form ID makes the unique context effectively tenant, definition, form IDs.
      // Setting the applicant URN restricts to one per applicant.
      applicantId:
        entity.definition?.oneFormPerApplicant && entity.applicant
          ? entity.applicant.urn.toString() // Creating user ID might be better, but that can be an intake service account.
          : entity.id,
      subscriberId: entity.applicant?.urn.toString(),
      status: entity.status,
      created: entity.created,
      createdBy: entity.createdBy,
      locked: entity.locked,
      submitted: entity.submitted,
      lastAccessed: entity.lastAccessed,
      securityClassification: entity.securityClassification,
      hash: entity.hash,
      data: entity.data,
      files: Object.entries(entity.files).reduce(
        (fs, [key, f]) => ({ ...fs, [key.replace('.', ':')]: f?.toString() }),
        {},
      ),
      dryRun: entity.dryRun,
      registeredId: entity.registeredId,
      version: entity.version,
    };
  }

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

    const version = getVersionFromDefinitionId(doc.definitionId);

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
        version: version,
      },
      doc.hash,
    );
  };
}
