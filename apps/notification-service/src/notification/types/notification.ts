import { Channel } from './channel';
import { Message } from './message';

export interface Notification {
  tenantId: string;
  typeId: string;
  correlationId?: string;
  channel: Channel;
  to: string;
  message: Message;
}
