import { Channel } from './type';
import { Message } from './message';

export interface NotificationContent {
  to: string;
  message: Message;
  from?: string;
  bcc?: string[];
  cc?: string[];
  attachments?: Attachment[];
}

export interface Attachment {
  filename: string;
  content: string;
  encoding: string;
  contentType: string;
}

export interface Notification extends NotificationContent {
  tenantId: string;
  type: {
    id: string;
    name: string;
  };
  event: {
    namespace: string;
    name: string;
    timestamp: Date;
  };
  correlationId?: string;
  context?: Record<string, boolean | number | string>;
  channel: Channel;
  subscriber?: {
    id: string;
    userId: string;
    addressAs: string;
  };
}

export interface NotificationWorkItem extends Notification {
  generationId: string;
}
