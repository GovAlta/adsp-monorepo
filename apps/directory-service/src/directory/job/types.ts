import { AdspId } from '@abgov/adsp-service-sdk';

export interface DirectoryWorkItem {
  tenantId: AdspId;
  urn: AdspId;
  work: 'resolve' | 'unknown';
}
