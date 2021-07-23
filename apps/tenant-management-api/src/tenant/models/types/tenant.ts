import { AdspId } from '@abgov/adsp-service-sdk';

export interface Tenant {
  id: AdspId | string;
  realm: string;
  adminEmail: string;
  tokenIssuer: string;
  name: string;
  createdBy?: string;
}
