import { EventCriteria } from './stream';

export interface WebhookEvent {
  namespace: string;
  name: string;
  criteria?: EventCriteria;
}

export interface Webhook {
  id: string;
  url: string;
  name: string;
  description?: string;
  events?: WebhookEvent[];
}

export interface AppStatusWebhook extends Webhook {
  targetId: string;
  intervalMinutes: number;
  generatedByTest?: boolean;
  eventTypes: { id: string }[];
}

export function isAppStatusWebhook(webhook: Webhook): webhook is AppStatusWebhook {
  return !!(webhook as AppStatusWebhook).targetId;
}
