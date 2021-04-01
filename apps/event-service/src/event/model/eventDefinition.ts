import { IsNotEmpty } from 'class-validator';
import {
  DomainEvent,
  DomainEventService,
  InvalidOperationError,
  UnauthorizedError,
  Update,
  User,
} from '@core-services/core-common';
import { EventDefinition } from '../types';
import { ValidationService } from '../validation';

export class EventDefinitionEntity implements EventDefinition {
  @IsNotEmpty()
  public namespace: string;
  @IsNotEmpty()
  public name: string;
  public description: string;
  public payloadSchema: object;
  @IsNotEmpty()
  public sendRoles: string[];

  constructor(public validationService: ValidationService, namespace: string, definition: EventDefinition) {
    this.namespace = namespace;
    this.name = definition.name;
    this.description = definition.description;
    this.payloadSchema = definition.payloadSchema || {};
    this.sendRoles = definition.sendRoles || [];
    this.validationService.setSchema(this);
  }

  update(update: Update<EventDefinition>) {
    if (update.description) {
      this.description = update.description;
    }

    if (update.payloadSchema) {
      this.payloadSchema = update.payloadSchema;
      this.validationService.setSchema(this);
    }

    if (update.sendRoles) {
      this.sendRoles = update.sendRoles;
    }
  }

  canSend(user: User) {
    return user && user.roles && this.sendRoles.find((r) => user.roles.includes(r));
  }

  send(service: DomainEventService, user: User, event: DomainEvent) {
    if (!this.canSend(user)) {
      throw new UnauthorizedError('User not authorized to send event.');
    }
    const {
      namespace: _namespace,
      name: _name,
      timestamp: _timestamp,
      correlationId: _correlationId,
      context: _context,
      ...payload
    } = event;
    if (!this.validationService.validate(this, payload)) {
      throw new InvalidOperationError('Event payload does not match schema.');
    }

    service.send(event);
  }
}
