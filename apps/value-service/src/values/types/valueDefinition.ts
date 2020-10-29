import { UserRole } from '@core-services/core-common';

export interface ValueDefinition {
  name: string
  description: string
  type: string
  jsonSchema: object
  readRoles: UserRole[]
  writeRoles: UserRole[]
}
