import { Namespace, ValueDefinition } from '../types';

export const mapNamespace = (namespace: Namespace) => ({
  name: namespace.name,
  description: namespace.description, 
  definitions: namespace.definitions,
  adminRole: namespace.adminRole
})

export const mapValueDefinition = (
  namespace: string, definition: ValueDefinition
) => ({
  namespace,
  name: definition.name,
  description: definition.description,
  type: definition.type,
  jsonSchema: definition.jsonSchema,
  readRoles: definition.readRoles,
  writeRoles: definition.writeRoles
})