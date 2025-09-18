import { EventSearchCriteria } from '@store/event/models';

export type InternalServiceStatusType = 'stopped' | 'healthy' | 'unhealthy' | 'pending';
export type PublicServiceStatusType = 'operational' | 'maintenance' | 'outage' | 'reported-issues';
export type ServiceStatusType = InternalServiceStatusType | PublicServiceStatusType | '';
export const PublicServiceStatusTypes = ['operational', 'maintenance', 'outage', 'reported-issues'];
export type EndpointStatusType = 'offline' | 'online' | 'pending';

// The following types are used in the control of the modal states
export const AddEditStatusWebhookType = '/status/webhook/modal/edit-add';
export const StatusWebhookHistoryType = '/status/webhook/modal/history';
export const DeleteStatusWebhookType = '/status/webhook/modal/delete';
export const TestStatusWebhookType = '/status/webhook/modal/test';

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
  status?: ServiceStatusType | '';
  internalStatus?: InternalServiceStatusType;
  endpoint?: ServiceStatusEndpoint;
  monitorOnly?: boolean;
  autoChangeStatus?: boolean;
}

export interface Webhooks {
  id: string;
  url: string;
  name: string;
  targetId: string;
  eventTypes: { id: string }[];
  intervalMinutes?: number;
  description: string;
  generatedByTest?: boolean;
}

export interface ApplicationWebhooks {
  applicationWebhookIntervals: Record<string, WebhookStatus>;
}

export interface WebhookStatus {
  appId: string;
  waitTimeInterval: number;
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
  applicationId?: string;
}

export const defaultHook: Webhooks = {
  id: '',
  name: '',
  url: '',
  targetId: '',
  intervalMinutes: 5,
  description: '',
  eventTypes: [],
};

export const createInitCriteria = (webhook: Webhooks): EventSearchCriteria => {
  return {
    name: 'webhook-triggered',
    namespace: 'push-service',
    timestampMax: '',
    timestampMin: '',
    url: webhook?.url,
    applications: webhook?.targetId,
    value: webhook?.targetId,
  };
};

export const initWebhookSearchCriteria: EventSearchCriteria = {
  context: { name: 'webhook-triggered', namespace: 'push-service' },
  correlationId: null,
};
