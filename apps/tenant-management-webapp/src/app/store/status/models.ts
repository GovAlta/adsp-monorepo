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
  applications: ApplicationStatus[];
  webhooks: Record<string, Webhooks>;
  currentFormData: ApplicationStatus;
  endpointHealth: Record<string, { url: string; entries: EndpointStatusEntry[] }>;
  metrics: ServiceStatusMetrics;
  contact: ContactInformation;
  testSuccess: number;
}

export interface FormData {
  name: string;
  description: string;
  endpoint: { url: string; status: string };
}

export interface StatusConfigurationInfo {
  contact: ContactInformation;
}

export interface ContactInformation {
  contactEmail?: string;
}

export interface ApplicationStatus {
  appKey: string;
  tenantId: string;
  name: string;
  description: string;
  metadata?: unknown;
  enabled: boolean;
  statusTimestamp?: number;
  status?: ServiceStatusType;
  internalStatus?: InternalServiceStatusType;
  endpoint?: ServiceStatusEndpoint;
  monitorOnly?: boolean;
}

export interface Webhooks {
  id: string;
  url: string;
  name: string;
  targetId: string;
  intervalMinutes: number;
  eventTypes: { id: string }[];
  description: string;
  generatedByTest?: boolean;
}

export interface UpdatePushConfig {
  operation: string;
  update: Record<string, Webhooks>;
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

export interface MetricResponse {
  values: { sum: string; max: string }[];
}
