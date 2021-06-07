import { InvalidOperationError } from '@core-services/core-common';
import { DomainEvent, EventDefinition } from '../types';
import { NamespaceEntity } from './namespace';
import { DomainEventService } from '../service';

export class EventDefinitionEntity implements EventDefinition {
  public namespace: NamespaceEntity;
  public name: string;
  public description: string;
  public payloadSchema: Record<string, unknown>;

  constructor(namespace: NamespaceEntity, definition: EventDefinition) {
    this.namespace = namespace;
    this.name = definition.name;
    this.description = definition.description;
    this.payloadSchema = definition.payloadSchema || {};
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

    if (!payload || !this.namespace.validationService.validate(this.getSchemaKey(), payload)) {
      throw new InvalidOperationError('Event payload does not match schema.');
    }
  }

  getSchemaKey(): string {
    return `${this.namespace.name}:${this.name}`;
  }
}
