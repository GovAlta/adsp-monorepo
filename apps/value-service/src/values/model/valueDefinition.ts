import { IsNotEmpty } from 'class-validator';
import { AdspId, AssertRole } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import { ServiceUserRoles } from '../types';
import type { Metric, MetricCriteria, Value, ValueCriteria, ValueDefinition } from '../types';
import { NamespaceEntity } from './namespace';

export class ValueDefinitionEntity implements ValueDefinition {
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

  @AssertRole('write value', ServiceUserRoles.Writer)
  public writeValue(user: User, tenantId: AdspId, value: Value): Promise<Value> {
    if (tenantId && !user?.isCore) {
      throw new UnauthorizedError(`User not authorized to write for tenant: ${tenantId}`);
    } else if (!tenantId) {
      tenantId = user.tenantId;
    }

    if ((value as Value).value === undefined) {
      value = {
        context: {},
        correlationId: null,
        timestamp: new Date(),
        value,
      };
    }

    if (!this.namespace.validationService.validate(this.getSchemaKey(), value.value)) {
      throw new InvalidOperationError('Value does not match schema.');
    }

    const valueRecord = {
      context: value.context,
      timestamp: value.timestamp || new Date(),
      correlationId: value.correlationId,
      value: value.value,
    };

    if (value.value && value.value['val-metrics']) {
      const metrics: { [name: string]: number } = value.value['val-metrics'];
      delete value.value['val-metrics'];

      Object.entries(metrics).forEach(([name, value]) =>
        this.namespace.repository.writeMetric(tenantId, this, name, valueRecord.timestamp, value)
      );
    }

    return this.namespace.repository.writeValue(tenantId, this, valueRecord);
  }

  @AssertRole('read value', ServiceUserRoles.Reader)
  public readValues(user: User, criteria: ValueCriteria): Promise<Value[]> {
    return this.namespace.repository.readValues(user.tenantId, this.namespace.name, this.name, criteria);
  }

  @AssertRole('read value', ServiceUserRoles.Reader)
  public readValueMetric(user: User, metric: string, criteria?: MetricCriteria): Promise<Metric> {
    return this.namespace.repository.readMetric(user.tenantId, this, metric, criteria);
  }

  public getSchemaKey(): string {
    return `${this.namespace}${this.name}`;
  }
}
