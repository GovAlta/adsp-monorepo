export type ServiceStatusType = 'online' | 'offline';

export interface ServiceStatus {
  name: string;
  tenantId: string;
  applications?: ServiceStatusApplication[];
}

export interface ServiceStatusApplication {
  name: string;
  metadata?: unknown;
  status?: ServiceStatusType;
  statusTimestamp?: number;
  timeIntervalMin: number;
  endpoints: string[];
  // Does there need to be more than one?
  config: ServiceStatusApplicationConfiguration[];
}

export interface ServiceStatusApplicationConfiguration {
  endpoint: string;
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
