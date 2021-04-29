export interface Job {
  id: string;
  name: string;
}

export type ServiceStatusType = 'online' | 'offline';

export interface ServiceStatus {
  name: string;
  tenantId: string;
  applications?: ServiceStatusApplication[];
}

export interface ServiceStatusApplication {
  name: string;
  metadata?: {};
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
  data: {};
  level: 'severe' | '???';
}

export interface ServiceStatusLog {
  applicationId: string;
  timestamp: number;
  status: ServiceStatusType;
}
