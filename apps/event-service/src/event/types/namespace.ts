import { UserRole } from '@core-services/core-common';
import { EventDefinition } from './eventDefinition';

export interface Namespace {
  name: string;
  description: string;
  definitions?: {
    [name: string]: EventDefinition;
  };
  adminRole: UserRole;
}
