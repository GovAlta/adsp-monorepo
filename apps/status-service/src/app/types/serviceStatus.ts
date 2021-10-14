export type InternalServiceStatusType = 'stopped' | 'healthy' | 'unhealthy' | 'pending';

export type PublicServiceStatusType = 'operational' | 'reported-issues' | 'maintenance' | 'outage';

export type ServiceStatusType = InternalServiceStatusType | PublicServiceStatusType;

export type EndpointStatusType = 'online' | 'offline' | 'pending' | 'disabled';

export interface ServiceStatusApplication {
  _id?: string;
  description: string;
  endpoint: ServiceStatusEndpoint;
  status?: PublicServiceStatusType;
  internalStatus?: InternalServiceStatusType;
  metadata: unknown;
  name: string;
  statusTimestamp: number;
  tenantId: string;
  tenantName: string;
  tenantRealm: string;
  enabled: boolean;
}

export interface ServiceStatusApplicationFilter {
  _id?: string;
  description: string;
  endpoint: ServiceStatusEndpoint;
  status?: PublicServiceStatusType;
  internalStatus?: InternalServiceStatusType;
  metadata: unknown;
  name: string;
  statusTimestamp: number;
  tenantId: string;
  tenantName: { $regex: string; $options: 'i' };
  tenantRealm: string;
  enabled: boolean;
}

export interface TenantCriteria {
  tenantName: { $regex: string; $options: 'i' };
}

export type ServiceStatusApplicationModel = ServiceStatusApplication & Document;

export interface ServiceStatusEndpoint {
  url: string;
  status: EndpointStatusType;
}

export interface ServiceStatusNotifications {
  applicationId: string;
  type: string;
  data: unknown;
  level: 'severe' | '???';
}

export interface ServiceStatusLog {
  applicationId: string;
  timestamp: number;
  status: ServiceStatusType;
}
