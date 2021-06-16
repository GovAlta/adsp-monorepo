export type InternalServiceStatusType = 'operational' | 'reported-issues' | 'pending' | 'disabled';
export type PublicServiceStatusType = 'enabled' | 'maintenance' | 'outage' | 'disabled';
export const PublicServiceStatusTypes = ['enabled', 'maintenance', 'outage', 'disabled'];
export type EndpointStatusType = 'up' | 'down' | 'pending' | 'disabled';

export interface ServiceStatus {
  applications: ServiceStatusApplication[];
}

export interface ServiceStatusApplication {
  _id?: string;
  tenantId: string;
  name: string;
  description: string;
  metadata?: unknown;
  enabled: boolean;
  statusTimestamp?: number;
  timeIntervalMin: number;
  internalStatus: InternalServiceStatusType;
  publicStatus: PublicServiceStatusType;
  endpoints: ServiceStatusEndpoint[];
}

export interface ServiceStatusEndpoint {
  url: string;
  status: EndpointStatusType;

  statusEntries?: EndpointStatusEntry[];
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
  status: InternalServiceStatusType & PublicServiceStatusType;
}

export interface EndpointStatusEntry {
  ok: boolean;
  url: string;
  timestamp: number;
  responseTime: number;
  status: number | string;
}
