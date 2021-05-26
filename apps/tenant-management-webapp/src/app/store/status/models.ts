export type ServiceStatusType = 'unknown' | 'online' | 'offline';
export type ServiceStatusState = 'loading' | 'success' | 'error';

export interface ServiceStatus {
  applications: ServiceStatusApplication[];
}

export interface ServiceStatusApplication {
  id?: string;
  tenantId: string;
  name: string;
  metadata?: unknown;
  enabled: boolean;
  statusTimestamp?: number;
  timeIntervalMin: number;
  endpoints: ServiceStatusEndpoint[];
}

export interface ServiceStatusEndpoint {
  url: string;
  status: ServiceStatusType;
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
