import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, InvalidOperationError, Results, ValidationService } from '@core-services/core-common';
import { model, Model, PipelineStage } from 'mongoose';
import { Logger } from 'winston';
import {
  ConfigurationRepository,
  ConfigurationEntity,
  ConfigurationRevision,
  RevisionCriteria,
  ConfigurationDefinition,
  ConfigurationEntityCriteria,
} from '../configuration';
import { renamePrefixProperties } from './prefix';
import { activeRevisionSchema, revisionSchema } from './schema';
import { ActiveRevisionDoc, ConfigurationRevisionDoc, RevisionAggregateDoc } from './types';

export class MongoConfigurationRepository implements ConfigurationRepository {
  private revisionModel: Model<ConfigurationRevisionDoc>;
  private activeRevisionModel: Model<ActiveRevisionDoc>;

  private readonly META_PREFIX = 'META_';

  constructor(private logger: Logger, private validationService: ValidationService) {
    this.revisionModel = model<ConfigurationRevisionDoc>('revision', revisionSchema);
    this.activeRevisionModel = model<ActiveRevisionDoc>('activeRevision', activeRevisionSchema);

    const handleIndexError = (err: unknown) => {
      if (err) {
        this.logger.error(`Error encountered ensuring index: ${err}`);
      }
    };
    this.revisionModel.on('index', handleIndexError);
    this.activeRevisionModel.on('index', handleIndexError);
  }

  async find<C>(
    criteria: ConfigurationEntityCriteria,
    top: number = 10,
    after?: string
  ): Promise<Results<ConfigurationEntity<C>>> {
    const skip = decodeAfter(after);

    const tenant = criteria.tenantIdEquals?.toString() || { $exists: false };
    const query: Record<string, unknown> = { tenant };
    if (criteria.namespaceEquals) {
      query.namespace = criteria.namespaceEquals;
    }

    if (criteria.registeredIdEquals) {
      query['configuration.registeredId'] = criteria.registeredIdEquals;
    }

    if (criteria.nameContains) {
      query.name = {
        $regex: criteria.nameContains,
        $options: 'i',
      };
    }

    const pipeline: PipelineStage[] = [
      { $match: query },
      { $sort: { namespace: 1, name: 1, tenant: 1, revision: 1 } },
      {
        $group: {
          _id: { namespace: '$namespace', name: '$name', tenant: '$tenant' },
          revision: { $last: '$revision' },
          created: { $last: '$created' },
          lastUpdated: { $last: '$lastUpdated' },
          configuration: { $last: '$configuration' },
        },
      },
    ];

    const docs: RevisionAggregateDoc<C>[] = await this.revisionModel.aggregate(pipeline).skip(skip).limit(top).exec();

    return {
      results: docs.map(({ _id, ...result }) => {
        return new ConfigurationEntity<C>(
          _id.namespace,
          _id.name,
          this.logger,
          this,
          this.validationService,
          this.fromDoc(result),
          criteria.tenantIdEquals
        );
      }),
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    };
  }

  async get<C>(
    namespace: string,
    name: string,
    tenantId?: AdspId,
    definition?: ConfigurationDefinition
  ): Promise<ConfigurationEntity<C>> {
    const tenant = tenantId?.toString() || { $exists: false };
    const query = { namespace, name, tenant };

    const latestDoc = await new Promise<ConfigurationRevisionDoc>((resolve, reject) => {
      this.revisionModel
        .find(query, null, { lean: true })
        .sort({ revision: -1 })
        .limit(1)
        .exec((err, results: ConfigurationRevisionDoc[]) => (err ? reject(err) : resolve(results[0])));
    });

    const latest = this.fromDoc<C>(latestDoc);

    return new ConfigurationEntity<C>(
      namespace,
      name,
      this.logger,
      this,
      this.validationService,
      latest,
      tenantId,
      definition
    );
  }

  async delete<C>(entity: ConfigurationEntity<C>): Promise<boolean> {
    const query = {
      namespace: entity.namespace,
      name: entity.name,
      tenant: entity.tenantId?.toString() || { $exists: false },
    };

    const { deletedCount } = await this.revisionModel.deleteMany(query);
    await this.clearActiveRevision(entity);

    return deletedCount > 0;
  }

  async getRevisions<C>(
    entity: ConfigurationEntity<C>,
    top: number,
    after: string,
    criteria: RevisionCriteria
  ): Promise<Results<ConfigurationRevision<C>>> {
    const query: Record<string, unknown> = {
      namespace: entity.namespace,
      name: entity.name,
      tenant: entity.tenantId?.toString() || { $exists: false },
    };

    if (criteria?.revision !== undefined) {
      query.revision = criteria.revision;
    }
    const skip = decodeAfter(after);

    const docs = await new Promise<ConfigurationRevisionDoc[]>((resolve, reject) => {
      this.revisionModel
        .find(query, null, { lean: true })
        .sort({ revision: -1 })
        .skip(skip)
        .limit(top)
        .exec((err, results: ConfigurationRevisionDoc[]) => (err ? reject(err) : resolve(results)));
    });
    return {
      results: docs.map((doc) => this.fromDoc<C>(doc)),
      page: {
        after,
        next: encodeNext(docs.length, top, skip),
        size: docs.length,
      },
    };
  }

  async saveRevision<C>(
    entity: ConfigurationEntity<C>,
    revision: ConfigurationRevision<C>
  ): Promise<ConfigurationRevision<C>> {
    const query: Record<string, unknown> = {
      namespace: entity.namespace,
      name: entity.name,
      revision: revision.revision,
      tenant: entity.tenantId?.toString() || { $exists: false },
    };
    const update: Record<string, unknown> = {
      namespace: entity.namespace,
      name: entity.name,
      revision: revision.revision,
      lastUpdated: new Date(),
      created: revision.created ? revision.created : new Date(),
    };
    // Only include tenant if there is a tenantId on the entity.
    if (entity.tenantId) {
      update.tenant = entity.tenantId.toString();
    }

    const doc = await new Promise<ConfigurationRevisionDoc<C>>((resolve, reject) => {
      this.revisionModel
        .findOneAndUpdate(
          query,
          {
            $set: {
              ...update,
              configuration: renamePrefixProperties(revision.configuration, '$', this.META_PREFIX),
            }
          },
          { upsert: true, new: true, lean: true }
        )
        .exec((err, res) => (err ? reject(err) : resolve(res as ConfigurationRevisionDoc<C>)));
    });
    return this.fromDoc(doc);
  }

  async getActiveRevision<C>(namespace: string, name: string, tenantId?: AdspId): Promise<ConfigurationRevision<C>> {
    const tenant = tenantId?.toString() || { $exists: false };
    const query = { namespace, name, tenant };

    let doc: ConfigurationRevisionDoc;
    const result: ActiveRevisionDoc = await this.activeRevisionModel.findOne(query, null, { lean: true }).exec();
    if (result) {
      doc = await this.revisionModel
        .findOne(
          {
            ...query,
            revision: result.active,
          },
          null,
          { lean: true }
        )
        .exec();
    }

    return this.fromDoc(doc);
  }

  async clearActiveRevision<C>(entity: ConfigurationEntity<C>): Promise<boolean> {
    const query = {
      namespace: entity.namespace,
      name: entity.name,
      tenant: entity.tenantId?.toString() || { $exists: false },
    };

    const { deletedCount } = await this.activeRevisionModel.deleteOne(query);

    return deletedCount > 0;
  }

  async setActiveRevision<C>(entity: ConfigurationEntity<C>, active: number): Promise<ConfigurationRevision<C>> {
    if (typeof active !== 'number' || active < 0) {
      throw new InvalidOperationError('Active revision value must be greater than or equal to 0.');
    }

    const query: Record<string, unknown> = {
      namespace: entity.namespace,
      name: entity.name,
      tenant: entity.tenantId?.toString() || { $exists: false },
    };

    const targetRevision = await this.revisionModel
      .findOne({ ...query, revision: active }, null, { lean: true })
      .exec();
    if (!targetRevision) {
      throw new InvalidOperationError(`Specified revision ${active} to set as active cannot be found.`);
    }

    let doc: ConfigurationRevisionDoc;

    const update: Record<string, unknown> = { active };
    const updated = await this.activeRevisionModel
      .findOneAndUpdate(query, update, { upsert: true, new: true, lean: true })
      .exec();

    if (updated) {
      doc = await this.revisionModel.findOne({ ...query, revision: updated.active }, null, { lean: true }).exec();
    }

    return this.fromDoc(doc);
  }

  private fromDoc<C>(doc: Omit<ConfigurationRevisionDoc, 'tenant' | 'namespace' | 'name'>): ConfigurationRevision<C> {
    return doc
      ? {
          revision: doc.revision,
          created: doc.created,
          lastUpdated: doc.lastUpdated,
          configuration: renamePrefixProperties(doc.configuration, this.META_PREFIX, '$') as C,
        }
      : null;
  }
}
