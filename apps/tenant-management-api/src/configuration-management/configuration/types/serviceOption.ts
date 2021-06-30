import { ServiceRole } from '@abgov/adsp-service-sdk';

export interface ServiceOption {
  service: string;
  id: string;
  version: string;
  configOptions: Record<string, unknown>;
  displayName: string;
  description: string;
  configSchema: Record<string, unknown>;
  roles: ServiceRole[];
}
