import { AdspId } from '@abgov/adsp-service-sdk';

export interface ActiveRevision {
  namespace: string;
  name: string;
  tenantId?: AdspId;
  active: number;
}
