import { EventDefinition, Namespace } from '../types';

export const mapNamespace = (entity: Namespace) => ({
  name: entity.name,
  description: entity.description,
  adminRole: entity.adminRole,
});

export const mapEventDefinition = (namespace: string, definition: EventDefinition) => ({
  namespace,
  name: definition.name,
  description: definition.description,
  payloadSchema: definition.payloadSchema,
  sendRoles: definition.sendRoles,
});
