export type InternalServiceStatusType = 'operational' | 'reported-issues' | 'pending' | 'disabled';

export type PublicServiceStatusType = 'operational' | 'maintenance' | 'outage' | 'pending' | 'disabled';

export type ServiceStatusType = InternalServiceStatusType | PublicServiceStatusType;

export type EndpointStatusType = 'up' | 'down' | 'pending' | 'disabled';

export type ManualOverrideState = 'on' | 'off';

export function isValidPublicServiceStatusType(status: PublicServiceStatusType): boolean {
  switch (status) {
    case 'maintenance':
    case 'operational':
    case 'outage':
    case 'disabled':
      return true;
    default:
      return false;
  }
}

export function isValidInternalServiceStatusType(status: InternalServiceStatusType): boolean {
  switch (status) {
    case 'operational':
    case 'reported-issues':
    case 'pending':
    case 'disabled':
      return true;
    default:
      return false;
  }
}

export function isValidEndpointStatusType(status: EndpointStatusType): boolean {
  switch (status) {
    case 'disabled':
    case 'up':
    case 'down':
    case 'pending':
      return true;
    default:
      return false;
  }
}

export interface ServiceStatusApplication {
  _id?: string;
  description: string;
  endpoints: ServiceStatusEndpoint[];
  status: ServiceStatusType;
  metadata: unknown;
  name: string;
  statusTimestamp: number;
  tenantId: string;
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
