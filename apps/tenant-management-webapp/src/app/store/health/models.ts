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
  // Does there need to be more than one?
  config: {
    endpoint: string;
    timeIntervalMin: number;
  };
}

export interface ServiceStatusNotifications {
  applicationId: string;
  type: string;
  data: unknown;
  level: 'severe' | 'meh';
}

export interface ServiceStatusLog {
  applicationId: string;
  timestamp: number;
  status: ServiceStatusType;
}
