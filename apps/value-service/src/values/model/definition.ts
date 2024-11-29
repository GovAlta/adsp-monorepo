import { AdspId, AssertRole } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { ServiceUserRoles } from '../types';
import type { Value, ValueCriteria, ValueDefinition } from '../types';
import { NamespaceEntity } from './namespace';

export class ValueDefinitionEntity implements ValueDefinition {
  public static METRICS_KEY = 'metrics';
  public static METRIC_META_KEY = 'metric';

  public name: string;
  public description: string;
  public type: string;
  public jsonSchema: Record<string, unknown>;
  public sendWriteEvent: boolean;

  constructor(public namespace: NamespaceEntity, definition: ValueDefinition) {
    this.namespace = namespace;
    this.name = definition.name;
    this.description = definition.description;
    this.type = definition.type;
    this.jsonSchema = definition.jsonSchema;
    this.sendWriteEvent = definition.sendWriteEvent || false;
    namespace.validationService.setSchema(this.getSchemaKey(), definition.jsonSchema || {});
  }

  public prepareWrite(tenantId: AdspId, value: Omit<Value, 'tenantId'>): Value {
    this.namespace.validationService.validate(
      `value '${this.namespace.name}:${this.name}'`,
      this.getSchemaKey(),
      value.value
    );

    const valueRecord: Value = {
      context: value.context,
      timestamp: value.timestamp || new Date(),
      tenantId,
      correlationId: value.correlationId,
      value: value.value,
      metrics: value.metrics,
    };

    const metrics: Record<string, number> = value.value?.[ValueDefinitionEntity.METRICS_KEY];
    // If the value itself has a metrics property, then merge them into the record.
    // Note: This is part of the custom schema handling that copies from a value object into a metrics property.
    if (metrics) {
      valueRecord.metrics = {
        ...value.metrics,
        ...metrics,
      };
      delete value.value[ValueDefinitionEntity.METRICS_KEY];
    }

    return valueRecord;
  }

  @AssertRole('read value', ServiceUserRoles.Reader, null, true)
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
    return `${this.namespace.name}:${this.name}`;
  }
}
