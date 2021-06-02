import type { User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, UnauthorizedError } from '@core-services/core-common';
import { DomainEventService } from '../service';
import { DomainEvent, EventDefinition } from '../types';
import { ValidationService } from '../service';
import { NamespaceEntity } from './namespace';
import { EventServiceRoles } from '../role';

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

  canSend(user: User): boolean {
    return this.namespace.canSend(user) && user.roles && user.roles.includes(EventServiceRoles.sender);
  }

  send(service: DomainEventService, validationService: ValidationService, user: User, event: DomainEvent): void {
    if (!this.canSend(user)) {
      throw new UnauthorizedError('User not authorized to send event.');
    }

    const {
      namespace: _namespace,
      name: _name,
      timestamp: _timestamp,
      correlationId: _correlationId,
      tenantId: _tenantId,
      context: _context,
      payload,
    } = event;

    if (!payload || !validationService.validate(this.namespace.name, this, payload)) {
      throw new InvalidOperationError('Event payload does not match schema.');
    }

    service.send(event);
  }
}
