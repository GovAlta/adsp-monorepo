import { AdspId } from '@abgov/adsp-service-sdk';
import { ValidationService } from '@core-services/core-common';
import { model, Model } from 'mongoose';
import { ConfigurationRepository, ServiceConfigurationEntity, ConfigurationRevision } from '../configuration';
import { revisionSchema } from './schema';
import { ConfigurationRevisionDoc } from './types';

export class MongoConfigurationRepository implements ConfigurationRepository {
  private revisionModel: Model<ConfigurationRevisionDoc>;

  constructor(private validationService: ValidationService) {
    this.revisionModel = model('revision', revisionSchema);
  }

  async get<C>(
    serviceId: AdspId,
    tenantId?: AdspId,
    schema?: Record<string, unknown>
  ): Promise<ServiceConfigurationEntity<C>> {
    const tenant = tenantId?.toString();
    const query = { namespace: serviceId.namespace, service: serviceId.service, tenant };
    const latestDoc = await new Promise<ConfigurationRevisionDoc>((resolve, reject) => {
      this.revisionModel
        .find(query, null, { lean: true })
        .sort({ revision: -1 })
        .limit(1)
        .exec((err, results: ConfigurationRevisionDoc[]) => (err ? reject(err) : resolve(results[0])));
    });

    const latest = latestDoc
      ? {
          revision: latestDoc.revision,
          configuration: latestDoc.configuration as C,
        }
      : null;

    return new ServiceConfigurationEntity<C>(
      serviceId,
      this,
      this.validationService,
      latest,
      tenantId,
      schema
    );
  }

  getRevisions<C>(_entity: ServiceConfigurationEntity<C>): Promise<ConfigurationRevision<C>[]> {
    throw new Error('Method not implemented.');
  }

  async saveRevision<C>(
    entity: ServiceConfigurationEntity<C>,
    revision: ConfigurationRevision<C>
  ): Promise<ConfigurationRevision<C>> {
    const query: Record<string, unknown> = {
      namespace: entity.serviceId.namespace,
      service: entity.serviceId.service,
      revision: revision.revision,
    };

    if (entity.tenantId) {
      query.tenant = entity.tenantId.toString();
    }

    const doc = await new Promise<ConfigurationRevisionDoc<C>>((resolve, reject) => {
      this.revisionModel
        .findOneAndUpdate(
          query,
          {
            ...query,
            configuration: revision.configuration,
          },
          { upsert: true, new: true, lean: true }
        )
        .exec((err, res) => (err ? reject(err) : resolve(res as ConfigurationRevisionDoc<C>)));
    });

    return {
      revision: doc.revision,
      configuration: doc.configuration,
    };
  }
}
