import { AdspId } from '@abgov/adsp-service-sdk';
import { EventDefinition } from './definition';

export interface Namespace {
  tenantId?: AdspId;
  name: string;
  definitions: {
    [name: string]: EventDefinition;
  };
}
