import { AdspId } from '@abgov/adsp-service-sdk';

export interface Queue {
  tenantId: AdspId;
  namespace: string;
  name: string;
  context: Record<string, string | number | boolean>;
  assignerRoles: string[];
  workerRoles: string[];
}
