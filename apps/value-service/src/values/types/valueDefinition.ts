import { UserRole } from '@core-services/core-common';

export interface ValueDefinition {
  name: string
  description: string
  type: string
  jsonSchema: Record<string, unknown>
  readRoles: UserRole[]
  writeRoles: UserRole[]
}
