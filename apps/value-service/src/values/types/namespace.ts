import { UserRole } from '@core-services/core-common';
import { ValueDefinition } from './valueDefinition';

export interface Namespace {
  name: string
  description: string
  definitions?: { 
    [name: string]: ValueDefinition 
  }
  adminRole: UserRole
}
