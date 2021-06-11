import { Document } from 'mongoose';

export type ServiceStatusType = 'operational' | 'maintenance' | 'reported-issues' | 'outage' | 'pending' | 'disabled';
export function isValidServiceStatusType(status: ServiceStatusType): boolean {
  switch (status) {
    case 'disabled':
    case 'maintenance':
    case 'operational':
    case 'outage':
    case 'pending':
    case 'reported-issues':
      return true;
    default:
      return false;
  }
}

export type EndpointStatusType = 'online' | 'offline' | 'pending' | 'disabled';

export function isValidEndpointStatusType(status: EndpointStatusType): boolean {
  switch (status) {
    case 'disabled':
    case 'online':
    case 'offline':
    case 'pending':
      return true;
    default:
      return false;
  }
}

export interface ServiceStatusApplication {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  metadata: unknown;
  statusTimestamp: number;
  timeIntervalMin: number;
  endpoints: ServiceStatusEndpoint[];
  status: ServiceStatusType;
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
