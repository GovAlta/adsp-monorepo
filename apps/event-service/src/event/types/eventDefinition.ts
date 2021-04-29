import { UserRole } from '@core-services/core-common';

export interface EventDefinition {
  name: string;
  description: string;
  payloadSchema: Record<string, unknown>;
  sendRoles: UserRole[];
}
