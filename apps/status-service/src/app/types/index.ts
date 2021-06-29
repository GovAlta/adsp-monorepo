import { Document } from 'mongoose';
import { ManualOverrideState } from './serviceStatus';

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
  _id?: string;
  tenantId: string;
  name: string;
  description: string;
  metadata: unknown;
  statusTimestamp: number;
  endpoints: ServiceStatusEndpoint[];
  status: ServiceStatusType;
  manualOverride: ManualOverrideState;
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

export type NoticeModeType = 'draft' | 'active' | 'archived';
export function isValidNoticeModeType(mode: NoticeModeType): boolean {
  switch (mode) {
    case 'draft':
    case 'active':
    case 'archived':
      return true;
    default:
      return false;
  }
}

export interface NoticeApplication {
  id: string;
  message: string;
  tennantServRef: string;
  startDate: Date;
  endDate: Date;
  mode: NoticeModeType;
}
export * from './serviceStatus';
export * from './endpointStatusEntry';
