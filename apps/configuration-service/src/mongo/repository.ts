import { AdspId } from '@abgov/adsp-service-sdk';
import { decodeAfter, encodeNext, Results, ValidationService } from '@core-services/core-common';
import { model, Model } from 'mongoose';
import { Logger } from 'winston';
import {
  ConfigurationRepository,
  ConfigurationEntity,
  ConfigurationRevision,
  RevisionCriteria,
  ActiveRevisionRepository,
  ConfigurationDefinition,
} from '../configuration';
import { renamePrefixProperties } from './prefix';
import { revisionSchema } from './schema';
import { ConfigurationRevisionDoc } from './types';

export class MongoConfigurationRepository implements ConfigurationRepository {
  private revisionModel: Model<ConfigurationRevisionDoc>;

  private readonly META_PREFIX = 'META_';

  constructor(
    private logger: Logger,
    private validationService: ValidationService,
    private activeRevisionRepository: ActiveRevisionRepository
  ) {
    this.revisionModel = model<ConfigurationRevisionDoc>('revision', revisionSchema);
  }

  async get<C>(
    namespace: string,
    name: string,
    tenantId?: AdspId,
    definition?: ConfigurationDefinition
  ): Promise<ConfigurationEntity<C>> {
    let tenant: string | { $exists: boolean } = '';
    if (tenantId) {
      tenant = tenantId.toString() || { $exists: false };
    }

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
      this.activeRevisionRepository,
      this.validationService,
      latest,
      tenantId,
      definition?.configurationSchema
    );
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
            ...update,
            configuration: renamePrefixProperties(revision.configuration, '$', this.META_PREFIX),
          },
          { upsert: true, new: true, lean: true }
        )
        .exec((err, res) => (err ? reject(err) : resolve(res as ConfigurationRevisionDoc<C>)));
    });
    return {
      revision: doc.revision,
      lastUpdated: doc.lastUpdated,
      created: doc.created,
      configuration: doc.configuration,
    };
  }

  private fromDoc<C>(doc: ConfigurationRevisionDoc): ConfigurationRevision<C> {
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
