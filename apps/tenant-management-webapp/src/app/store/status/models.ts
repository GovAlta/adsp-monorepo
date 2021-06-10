export type ServiceStatusType = 'operational' | 'maintenance' | 'reported-issues' | 'outage' | 'pending' | 'disabled';
export type EndpointStatusType = 'online' | 'offline' | 'pending' | 'disabled';

export interface ServiceStatus {
  applications: ServiceStatusApplication[];
}

export interface ServiceStatusApplication {
  id?: string;
  tenantId: string;
  name: string;
  description: string;
  metadata?: unknown;
  enabled: boolean;
  statusTimestamp?: number;
  timeIntervalMin: number;
  status: ServiceStatusType;
  endpoints: ServiceStatusEndpoint[];
}

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
