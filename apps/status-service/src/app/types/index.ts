import { Document } from 'mongoose';

export type ServiceStatusType = 'online' | 'offline' | 'pending';

export interface ServiceStatusApplication {
  id: string;
  tenantId: string;
  name: string;
  metadata: unknown;
  enabled: boolean;
  statusTimestamp: number;
  timeIntervalMin: number;
  endpoints: ServiceStatusEndpoint[];
}

export type ServiceStatusApplicationModel = ServiceStatusApplication & Document;

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
