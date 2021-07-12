import { Channel } from './channel';
import { Message } from './message';

export interface Notification {
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
  to: string;
  message: Message;
  subscriber: {
    id: string;
    userId: string;
    addressAs: string;
  };
}
