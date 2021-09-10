import { IsNotEmpty } from 'class-validator';
import { AdspId, AssertRole } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, Results } from '@core-services/core-common';
import { ServiceUserRoles } from '../types';
import type { Value, ValueCriteria, ValueDefinition } from '../types';
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
    this.namespace.validationService.validate(
      `value '${this.namespace}:${this.name}'`,
      this.getSchemaKey(),
      value.value
    );

    const valueRecord: Value = {
      context: value.context,
      timestamp: value.timestamp || new Date(),
      tenantId,
      correlationId: value.correlationId,
      value: value.value,
    };

    const metrics: Record<string, number> = value.value?.[ValueDefinitionEntity.METRICS_KEY];
    if (metrics) {
      value.metrics = {
        ...(value.metrics || {}),
        ...metrics,
      };
      delete value.value[ValueDefinitionEntity.METRICS_KEY];
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

  public getSchemaKey(): string {
    return `${this.namespace}${this.name}`;
  }
}
