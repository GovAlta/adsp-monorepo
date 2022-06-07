import { EventLogConfiguration, IntervalDefinition } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import type { EventDefinition } from '../types';
import { NamespaceEntity } from './namespace';

export class EventDefinitionEntity implements EventDefinition {
  public namespace: NamespaceEntity;
  public name: string;
  public description: string;
  public payloadSchema: Record<string, unknown>;
  public interval: IntervalDefinition;
  public log?: EventLogConfiguration;

  constructor(namespace: NamespaceEntity, definition: EventDefinition) {
    this.namespace = namespace;
    this.name = definition.name;
    this.description = definition.description;
    this.payloadSchema = definition.payloadSchema || {};
    this.interval = definition.interval;
    this.log = definition.log;
  }

  validate(event: DomainEvent): void {
    const {
      namespace: _namespace,
      name: _name,
      timestamp: _timestamp,
      correlationId: _correlationId,
      tenantId: _tenantId,
      context: _context,
      payload,
    } = event;

    this.namespace.validationService.validate(
      `event '${this.namespace.name}:${this.name}'`,
      this.getSchemaKey(),
      payload
    );
  }

  getSchemaKey(): string {
    return `${this.namespace.name}:${this.name}`;
  }
}
