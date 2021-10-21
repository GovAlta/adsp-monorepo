import { Channel } from './type';
import { Message } from './message';

export interface NotificationContent {
  to: string;
  message: Message;
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
  };
  correlationId?: string;
  context?: Record<string, boolean | number | string>;
  channel: Channel;
  subscriber: {
    id: string;
    userId: string;
    addressAs: string;
  };
}
