import { AdspId, ServiceRole } from '@abgov/adsp-service-sdk';

export interface ServiceClient {
  serviceId: AdspId,
  roles: ServiceRole[]
}