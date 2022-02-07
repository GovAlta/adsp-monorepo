export type InternalServiceStatusType = 'stopped' | 'healthy' | 'unhealthy' | 'pending';
export type PublicServiceStatusType = 'operational' | 'maintenance' | 'outage' | 'reported-issues';
export type ServiceStatusType = InternalServiceStatusType | PublicServiceStatusType;
export const PublicServiceStatusTypes = ['operational', 'maintenance', 'outage', 'reported-issues'];
export type EndpointStatusType = 'offline' | 'online' | 'pending';

export interface ServiceStatusMetrics {
  unhealthyCount?: number;
  totalUnhealthyDuration?: number;
  maxUnhealthyDuration?: number;
  leastHealthyApp?: { name: string; totalUnhealthyDuration: number };
}

export interface ServiceStatus {
  applications: ServiceStatusApplication[];
  currentFormData: ServiceStatusApplication;
  endpointHealth: Record<string, { url: string; entries: EndpointStatusEntry[] }>;
  metrics: ServiceStatusMetrics;
}

export interface FormData {
  name: string;
  description: string;
  endpoint: { url: string; status: string };
}

export interface ServiceStatusApplication {
  _id?: string;
  tenantId: string;
  name: string;
  description: string;
  metadata?: unknown;
  enabled: boolean;
  statusTimestamp?: number;
  status?: ServiceStatusType;
  internalStatus?: InternalServiceStatusType;
  endpoint?: ServiceStatusEndpoint;
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
  status: InternalServiceStatusType | PublicServiceStatusType;
}

export interface EndpointStatusEntry {
  ok: boolean;
  url: string;
  timestamp: number;
  responseTime: number;
  status: number | string;
}
