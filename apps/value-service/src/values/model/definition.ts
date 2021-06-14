import { IsNotEmpty } from 'class-validator';
import { AdspId, AssertRole } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, Results, UnauthorizedError } from '@core-services/core-common';
import { ServiceUserRoles } from '../types';
import type { Metric, MetricCriteria, Value, ValueCriteria, ValueDefinition } from '../types';
import { NamespaceEntity } from './namespace';

export class ValueDefinitionEntity implements ValueDefinition {
  public static METRICS_KEY = 'metrics';
  public static METRIC_META_KEY = 'metric';

  @IsNotEmpty()
  public name: string;
  public description: string;
  public type: string;
  public jsonSchema: Record<string, unknown>;

  constructor(public namespace: NamespaceEntity, definition: ValueDefinition) {
    this.namespace = namespace;
    this.name = definition.name;
    this.description = definition.description;
    this.type = definition.type;
    this.jsonSchema = definition.jsonSchema;
    namespace.validationService.setSchema(this.getSchemaKey(), definition.jsonSchema || {});
  }

  public writeValue(tenantId: AdspId, value: Omit<Value, 'tenantId'>): Promise<Value> {
    if (!this.namespace.validationService.validate(this.getSchemaKey(), value.value)) {
      throw new InvalidOperationError('Value does not match schema.');
    }

    const valueRecord: Value = {
      context: value.context,
      timestamp: value.timestamp || new Date(),
      tenantId,
      correlationId: value.correlationId,
      value: value.value,
    };

    if (value.value && value.value['metrics']) {
      const metrics: { [name: string]: number } = value.value['metrics'];
      delete value.value['metrics'];

      Object.entries(metrics).forEach(([name, value]) =>
        this.namespace.repository.writeMetric(tenantId, this, name, valueRecord.timestamp, value)
      );
    }

    return this.namespace.repository.writeValue(this.namespace.name, this.name, tenantId, valueRecord);
  }

  @AssertRole('read value', ServiceUserRoles.Reader)
  public readValues(
    _user: User,
    tenantId?: AdspId,
    top?: number,
    after?: string,
    criteria?: ValueCriteria
  ): Promise<Results<Value>> {
    return this.namespace.repository.readValues(top, after, {
      ...criteria,
      namespace: this.namespace.name,
      name: this.name,
      tenantId,
    });
  }

  @AssertRole('read value', ServiceUserRoles.Reader)
  public readValueMetric(user: User, metric: string, criteria?: MetricCriteria): Promise<Metric> {
    return this.namespace.repository.readMetric(user.tenantId, this, metric, criteria);
  }

  public getSchemaKey(): string {
    return `${this.namespace}${this.name}`;
  }
}
